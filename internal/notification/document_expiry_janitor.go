package notification

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// docExpirySweepLockKey is the pg advisory lock guarding the sweep so exactly
// one replica flips statuses per run (same pattern as the offer janitor 911001
// and telemetry pruner 911002).
const docExpirySweepLockKey = 911003

// DocumentExpiryJanitor flips vehicle_documents.status along
// SUBMITTED/VALID → EXPIRING (≤30 days out) → EXPIRED (past expiry_date), and
// queues a push to the owning driver on every transition. The read path
// (driver_self_service_handler.docStatus) already derives live status from
// expiry_date; this job persists the flip and, more importantly, notifies —
// a derivation at read time can't tell the driver who hasn't opened the app.
type DocumentExpiryJanitor struct {
	dbPool   *pgxpool.Pool
	interval time.Duration
}

func NewDocumentExpiryJanitor(db *pgxpool.Pool) *DocumentExpiryJanitor {
	hours := 24
	if v, err := strconv.Atoi(os.Getenv("DOC_EXPIRY_INTERVAL_HOURS")); err == nil && v > 0 {
		hours = v
	}
	return &DocumentExpiryJanitor{dbPool: db, interval: time.Duration(hours) * time.Hour}
}

// StartLoop sweeps once at boot, then on the configured interval (nightly by
// default). Ticker drift across restarts is fine — transitions are idempotent.
func (j *DocumentExpiryJanitor) StartLoop(ctx context.Context) {
	log.Printf("[DOC_EXPIRY] janitor started, interval %s", j.interval)
	j.sweep(ctx)

	ticker := time.NewTicker(j.interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			j.sweep(ctx)
		}
	}
}

func (j *DocumentExpiryJanitor) sweep(ctx context.Context) {
	sweepCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	conn, err := j.dbPool.Acquire(sweepCtx)
	if err != nil {
		return
	}
	defer conn.Release()

	var locked bool
	if err := conn.QueryRow(sweepCtx, "SELECT pg_try_advisory_lock($1)", docExpirySweepLockKey).Scan(&locked); err != nil || !locked {
		return // another replica owns this sweep
	}
	defer conn.Exec(context.Background(), "SELECT pg_advisory_unlock($1)", docExpirySweepLockKey)

	// One transition at a time, each returning what changed so we can notify.
	type transition struct {
		newStatus, where_, title, bodyTmpl string
	}
	transitions := []transition{
		{
			newStatus: "EXPIRED",
			where_:    "expiry_date < CURRENT_DATE AND status <> 'EXPIRED'",
			title:     "Document expired",
			bodyTmpl:  "Your vehicle %s has expired. Upload a renewed document to keep driving.",
		},
		{
			newStatus: "EXPIRING",
			where_:    "expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND status NOT IN ('EXPIRING','EXPIRED')",
			title:     "Document expiring soon",
			bodyTmpl:  "Your vehicle %s expires soon. Renew it before it lapses.",
		},
	}

	docLabel := map[string]string{"RC": "registration certificate (RC)", "INSURANCE": "insurance", "PUC": "PUC certificate"}

	for _, t := range transitions {
		rows, err := conn.Query(sweepCtx, `
			WITH flipped AS (
				UPDATE vehicle_documents vd
				SET status = $1, updated_at = NOW()
				WHERE vd.expiry_date IS NOT NULL AND `+t.where_+`
				RETURNING vd.id, vd.vehicle_id, vd.document_type
			)
			SELECT f.id, f.document_type, dv.driver_id
			FROM flipped f
			JOIN driver_vehicles dv ON dv.id = f.vehicle_id;
		`, t.newStatus)
		if err != nil {
			log.Printf("[DOC_EXPIRY] %s sweep failed: %v", t.newStatus, err)
			continue
		}

		type hit struct{ docID, docType, driverID string }
		var hits []hit
		for rows.Next() {
			var h hit
			if err := rows.Scan(&h.docID, &h.docType, &h.driverID); err == nil {
				hits = append(hits, h)
			}
		}
		rows.Close()

		for _, h := range hits {
			label, ok := docLabel[h.docType]
			if !ok {
				label = h.docType
			}
			_, err := conn.Exec(sweepCtx, `
				INSERT INTO notification_outbox (user_id, title, body, payload)
				VALUES ($1::uuid, $2, $3, jsonb_build_object('type','DOCUMENT_'||$4::text,'document_id',$5::text,'document_type',$6::text));
			`, h.driverID, t.title, fmt.Sprintf(t.bodyTmpl, label), t.newStatus, h.docID, h.docType)
			if err != nil {
				log.Printf("[DOC_EXPIRY] outbox insert failed for doc %s: %v", h.docID, err)
			}
		}
		if len(hits) > 0 {
			log.Printf("[DOC_EXPIRY] flipped %d documents to %s", len(hits), t.newStatus)
		}
	}
}

