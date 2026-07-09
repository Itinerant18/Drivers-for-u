package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/platform/driver-delivery/internal/notification"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	postgresURL := getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/delivery_platform?sslmode=disable")
	log.Println("Bootstrapping Single-Region Asynchronous Transactional Outbox Notification Daemon...")

	dbPool, err := pgxpool.New(ctx, postgresURL)
	if err != nil {
		log.Fatalf("PostgreSQL connection pool initialization failed: %v", err)
	}
	defer dbPool.Close()

	// Real FCM sender when a service-account credential is configured; stub
	// (log-only) otherwise so local dev and CI boot cleanly without secrets.
	// A misconfigured credential (unreadable/invalid file) must NOT crash the
	// daemon — it also runs the doc-expiry and payout workers, which have
	// nothing to do with FCM. Degrade to the stub and log loudly instead.
	var sender notification.FCMSender
	if s, err := notification.NewFCMHTTPSenderFromEnv(ctx); err == nil {
		log.Println("[NOTIFICATION] FCM HTTP v1 sender active")
		sender = s
	} else if err == notification.ErrFCMNotConfigured {
		log.Println("[NOTIFICATION] FCM_SERVICE_ACCOUNT_FILE unset — pushes will be logged, not delivered")
	} else {
		log.Printf("[NOTIFICATION] WARNING: FCM sender init failed (%v) — falling back to log-only; pushes will NOT be delivered until this is fixed", err)
	}

	daemon := notification.NewOutboxNotificationDaemon(dbPool, sender)

	// Start outbox processing loops concurrently
	go daemon.StartProcessingLoop(ctx)

	// Driver-lifecycle sweeps (single-replica via advisory locks):
	// vehicle-document expiry flips + expiry pushes, and the sandbox payout
	// settler that advances PENDING payouts when no real PSP is wired.
	docJanitor := notification.NewDocumentExpiryJanitor(dbPool)
	go docJanitor.StartLoop(ctx)

	payoutWorker := notification.NewSandboxPayoutWorker(dbPool)
	go payoutWorker.StartLoop(ctx)

	go startHealthServer("NOTIFICATION", getEnv("HEALTH_PORT", "8080"))

	shutdownSignal := make(chan os.Signal, 1)
	signal.Notify(shutdownSignal, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	<-shutdownSignal
	log.Println("Shutting down Outbox Notification Daemon cleanly.")
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// startHealthServer exposes /health (liveness) and /ready (readiness) so this
// otherwise-portless background worker can be probed by Kubernetes. The scratch
// runtime image has no shell, so an exec probe is not an option.
func startHealthServer(tag, port string) {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ready"))
	})
	log.Printf("[%s] health server listening on :%s", tag, port)
	if err := http.ListenAndServe(":"+port, mux); err != nil && err != http.ErrServerClosed {
		log.Printf("[%s] health server error: %v", tag, err)
	}
}
