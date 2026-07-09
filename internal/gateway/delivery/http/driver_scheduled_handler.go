package http

import (
	"context"
	"fmt"
	"net/http"
	"time"

	dispatchDomain "github.com/platform/driver-delivery/internal/dispatch/domain"
)

// ─── Scheduled-booking advance commitment ("Trip Planner") ────────────────────
//
// Scheduled orders normally sit in scheduled_dispatch_queue until ~lead-time
// before pickup, then flow through the live matcher like any instant booking.
// These endpoints let a driver commit EARLY instead: browse far-future
// scheduled orders in their city, accept one (locks the assignment and pulls
// the order out of the matcher path), or decline it (never shown again).
//
// A committed order stays at status ASSIGNED until the driver starts it via
// the existing offer-response ACCEPTED transition; the T-60/T-15 reminders are
// sent by the dispatch scheduler using the reminder flags on the queue row.

// HandleDriverGetScheduledOffers — GET /api/v1/driver/scheduled-offers
// Unassigned scheduled orders in the driver's city, further out than the
// dispatch lead (inside the lead the live matcher owns them), minus ones this
// driver has declined.
func (h *GatewayHandler) HandleDriverGetScheduledOffers(w http.ResponseWriter, r *http.Request) {
	driverID, ok := requireDriverIdentity(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 1500*time.Millisecond)
	defer cancel()

	leadInterval := fmt.Sprintf("%d seconds", int(dispatchDomain.ScheduledDispatchLead().Seconds()))
	rows, err := h.dbPool.Query(ctx, `
		SELECT o.id::text, o.scheduled_at, COALESCE(o.trip_type::text, 'CITY'),
		       ST_Y(o.pickup_location::geometry), ST_X(o.pickup_location::geometry),
		       o.base_fare_paise
		FROM orders o
		JOIN scheduled_dispatch_queue q ON q.order_id = o.id
		WHERE o.status = 'CREATED'::order_status_enum
		  AND o.assigned_driver_id IS NULL
		  AND o.scheduled_at > NOW() + $2::interval
		  AND q.dispatched_at IS NULL
		  AND o.city_prefix = (SELECT city_prefix FROM drivers WHERE id = $1::uuid)
		  AND NOT EXISTS (
		        SELECT 1 FROM scheduled_offer_declines d
		        WHERE d.order_id = o.id AND d.driver_id = $1::uuid)
		ORDER BY o.scheduled_at
		LIMIT 20;
	`, driverID, leadInterval)
	if err != nil {
		http.Error(w, "scheduled_offers_read_failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	offers := make([]map[string]interface{}, 0)
	for rows.Next() {
		var (
			id, tripType         string
			scheduledAt          time.Time
			pickupLat, pickupLng float64
			baseFarePaise        int64
		)
		if err := rows.Scan(&id, &scheduledAt, &tripType, &pickupLat, &pickupLng, &baseFarePaise); err != nil {
			http.Error(w, "scheduled_offers_decode_failed", http.StatusInternalServerError)
			return
		}
		offers = append(offers, map[string]interface{}{
			"id":              id,
			"scheduled_at":    scheduledAt,
			"trip_type":       tripType,
			"pickup_lat":      pickupLat,
			"pickup_lng":      pickupLng,
			"base_fare_paise": baseFarePaise,
		})
	}
	writeJSONResponse(w, http.StatusOK, map[string]interface{}{"offers": offers})
}

// HandleDriverAcceptScheduledOffer — POST /api/v1/driver/scheduled-offers/{id}/accept
// Locks the assignment: order → ASSIGNED to this driver, queue row stamped
// dispatched so the T-lead sweeper never re-emits it to the matcher.
func (h *GatewayHandler) HandleDriverAcceptScheduledOffer(w http.ResponseWriter, r *http.Request) {
	driverID, ok := requireDriverIdentity(w, r)
	if !ok {
		return
	}
	orderID := r.PathValue("id")
	if orderID == "" {
		http.Error(w, "missing_order_id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	tx, err := h.dbPool.Begin(ctx)
	if err != nil {
		http.Error(w, "scheduled_accept_tx_failed", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// Guarded transition: only an unassigned, still-future scheduled CREATED
	// order in the driver's own city can be committed. Two drivers racing on
	// the same order — one UPDATE wins, the other sees 0 rows → 409.
	tag, err := tx.Exec(ctx, `
		UPDATE orders o
		SET status = 'ASSIGNED'::order_status_enum, assigned_driver_id = $1::uuid, assigned_at = NOW()
		WHERE o.id = $2::uuid
		  AND o.status = 'CREATED'::order_status_enum
		  AND o.assigned_driver_id IS NULL
		  AND o.scheduled_at IS NOT NULL AND o.scheduled_at > NOW()
		  AND o.city_prefix = (SELECT city_prefix FROM drivers WHERE id = $1::uuid);
	`, driverID, orderID)
	if err != nil {
		http.Error(w, "scheduled_accept_failed", http.StatusInternalServerError)
		return
	}
	if tag.RowsAffected() == 0 {
		http.Error(w, "offer_no_longer_available", http.StatusConflict)
		return
	}

	// Pull the order out of the T-lead matcher path.
	if _, err := tx.Exec(ctx, `
		UPDATE scheduled_dispatch_queue SET dispatched_at = NOW()
		WHERE order_id = $1::uuid AND dispatched_at IS NULL;
	`, orderID); err != nil {
		http.Error(w, "scheduled_accept_queue_failed", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "scheduled_accept_commit_failed", http.StatusInternalServerError)
		return
	}

	writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"order_id": orderID,
		"status":   "ASSIGNED",
	})
}

// HandleDriverDeclineScheduledOffer — POST /api/v1/driver/scheduled-offers/{id}/decline
// Per-driver dismissal; the order stays available to everyone else.
func (h *GatewayHandler) HandleDriverDeclineScheduledOffer(w http.ResponseWriter, r *http.Request) {
	driverID, ok := requireDriverIdentity(w, r)
	if !ok {
		return
	}
	orderID := r.PathValue("id")
	if orderID == "" {
		http.Error(w, "missing_order_id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 1200*time.Millisecond)
	defer cancel()

	if _, err := h.dbPool.Exec(ctx, `
		INSERT INTO scheduled_offer_declines (order_id, driver_id)
		VALUES ($1::uuid, $2::uuid)
		ON CONFLICT DO NOTHING;
	`, orderID, driverID); err != nil {
		http.Error(w, "scheduled_decline_failed", http.StatusInternalServerError)
		return
	}
	writeJSONResponse(w, http.StatusOK, map[string]interface{}{"status": "DECLINED"})
}
