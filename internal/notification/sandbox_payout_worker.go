package notification

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// payoutSweepLockKey guards the sandbox settler (advisory-lock family:
// 911001 offer janitor, 911002 pruner, 911003 doc expiry).
const payoutSweepLockKey = 911004

// SandboxPayoutWorker advances driver payout_requests through the state
// machine (PENDING → PROCESSING → PAID) when no real PSP is wired, so the
// driver-facing payout history behaves like production. It is OFF unless
// PAYOUT_SANDBOX_AUTOSETTLE=true, and it never touches rows an admin has taken
// over: it only picks up PENDING rows with no batch, and only settles
// PROCESSING rows in its own SANDBOX batch. HELD/FAILED rows are untouched
// (admin retry resets FAILED→PENDING, which the worker will then pick up).
type SandboxPayoutWorker struct {
	dbPool  *pgxpool.Pool
	enabled bool
}

func NewSandboxPayoutWorker(db *pgxpool.Pool) *SandboxPayoutWorker {
	return &SandboxPayoutWorker{
		dbPool:  db,
		enabled: os.Getenv("PAYOUT_SANDBOX_AUTOSETTLE") == "true",
	}
}

func (w *SandboxPayoutWorker) StartLoop(ctx context.Context) {
	if !w.enabled {
		log.Println("[PAYOUT_SANDBOX] disabled (set PAYOUT_SANDBOX_AUTOSETTLE=true to auto-settle payouts)")
		return
	}
	log.Println("[PAYOUT_SANDBOX] auto-settler active — payouts advance PENDING→PROCESSING→PAID without a PSP")

	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.sweep(ctx)
		}
	}
}

func (w *SandboxPayoutWorker) sweep(ctx context.Context) {
	sweepCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()

	conn, err := w.dbPool.Acquire(sweepCtx)
	if err != nil {
		return
	}
	defer conn.Release()

	var locked bool
	if err := conn.QueryRow(sweepCtx, "SELECT pg_try_advisory_lock($1)", payoutSweepLockKey).Scan(&locked); err != nil || !locked {
		return
	}
	defer conn.Exec(context.Background(), "SELECT pg_advisory_unlock($1)", payoutSweepLockKey)

	// PENDING → PROCESSING: only unclaimed rows (no admin batch), aged ≥1 min so
	// a just-created request is visible as PENDING at least briefly.
	if _, err := conn.Exec(sweepCtx, `
		UPDATE payout_requests
		SET status = 'PROCESSING', payout_batch_id = 'SANDBOX', updated_at = NOW()
		WHERE status = 'PENDING'
		  AND payout_batch_id IS NULL
		  AND hold_reason IS NULL
		  AND created_at < NOW() - INTERVAL '1 minute';
	`); err != nil {
		log.Printf("[PAYOUT_SANDBOX] pending sweep failed: %v", err)
	}

	// PROCESSING → PAID: only our own SANDBOX batch, aged ≥2 min in processing.
	// Stamps a synthetic bank reference and pushes a "payout settled" alert.
	rows, err := conn.Query(sweepCtx, `
		UPDATE payout_requests
		SET status = 'PAID', bank_reference = 'SBX-' || id, updated_at = NOW()
		WHERE status = 'PROCESSING'
		  AND payout_batch_id = 'SANDBOX'
		  AND updated_at < NOW() - INTERVAL '2 minutes'
		RETURNING id, driver_id, net_amount_paise;
	`)
	if err != nil {
		log.Printf("[PAYOUT_SANDBOX] settle sweep failed: %v", err)
		return
	}

	type paid struct {
		id, driverID string
		netPaise     int64
	}
	var settled []paid
	for rows.Next() {
		var p paid
		if err := rows.Scan(&p.id, &p.driverID, &p.netPaise); err == nil {
			settled = append(settled, p)
		}
	}
	rows.Close()

	for _, p := range settled {
		if _, err := conn.Exec(sweepCtx, `
			INSERT INTO notification_outbox (user_id, title, body, payload)
			VALUES ($1::uuid, 'Payout settled',
			        '₹' || to_char($2::numeric / 100, 'FM999999990.00') || ' has been transferred to your bank account.',
			        jsonb_build_object('type','PAYOUT_PAID','payout_id',$3::text));
		`, p.driverID, p.netPaise, p.id); err != nil {
			log.Printf("[PAYOUT_SANDBOX] outbox insert failed for %s: %v", p.id, err)
		}
	}
	if len(settled) > 0 {
		log.Printf("[PAYOUT_SANDBOX] settled %d payouts", len(settled))
	}
}
