package http

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ForensicAuditTrail struct {
	OrderID         string                   `json:"order_id"`
	DriverID        string                   `json:"driver_id"`
	OfferTimestamps map[string]interface{}  `json:"offer_timestamps"`
	OdometerInputs  map[string]interface{}  `json:"odometer_inputs"`
	RouteMetrics    map[string]interface{}  `json:"route_metrics"`
	HardwareState   map[string]interface{}  `json:"hardware_state"`
	FinalInvoice    map[string]interface{}  `json:"final_invoice"`
	CapturedAt      time.Time                `json:"captured_at"`
}

type TripAuditHandler struct {
	dbPool *pgxpool.Pool
}

func NewTripAuditHandler(dbPool *pgxpool.Pool) *TripAuditHandler {
	return &TripAuditHandler{
		dbPool: dbPool,
	}
}

// GET /api/v1/admin/orders/{id}/forensic-audit
func (h *TripAuditHandler) CompileTripAuditTrail(w http.ResponseWriter, r *http.Request) {
	orderIDStr := r.PathValue("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var driverID uuid.UUID
	var offerReceived, offerResponded time.Time
	var offerResolution, declineReason string
	var responseLatencyMs int
	var startOdo, endOdo, startFuel, endFuel, otpAttempts, waitMin, idleMin, deviationMeters int
	var paymentMethod string
	var paymentConfirmedAt *time.Time
	var ratingRider, ratingDriver *int
	var arrivalAt, tripStartedAt, tripEndedAt *time.Time
	var baseP, distP, nightP, totalP int64

	dbErr := h.dbPool.QueryRow(ctx, `
		SELECT tas.driver_id, tas.offer_received_at, tas.offer_responded_at, tas.offer_resolution,
		       COALESCE(tas.decline_reason, ''), tas.response_latency_ms,
		       tas.start_odometer, tas.end_odometer, tas.start_fuel_percentage, tas.end_fuel_percentage, tas.otp_attempts_count,
		       tas.arrival_at, tas.trip_started_at, tas.trip_ended_at,
		       tas.total_wait_minutes, tas.total_idle_minutes, tas.total_route_deviation_meters,
		       tas.payment_method, tas.payment_confirmed_at, tas.rating_rider_stars, tas.rating_driver_stars,
		       COALESCE(fb.base_paise, 0), COALESCE(fb.distance_paise, 0), COALESCE(fb.night_paise, 0), COALESCE(fb.total_paise, 0)
		FROM trip_audit_summaries tas
		LEFT JOIN order_fare_breakdowns fb ON fb.order_id = tas.order_id
		WHERE tas.order_id = $1::uuid
	`, orderID).Scan(
		&driverID, &offerReceived, &offerResponded, &offerResolution, &declineReason, &responseLatencyMs,
		&startOdo, &endOdo, &startFuel, &endFuel, &otpAttempts,
		&arrivalAt, &tripStartedAt, &tripEndedAt, &waitMin, &idleMin, &deviationMeters,
		&paymentMethod, &paymentConfirmedAt, &ratingRider, &ratingDriver,
		&baseP, &distP, &nightP, &totalP,
	)
	if dbErr != nil {
		// No trip_audit_summaries row → this order never produced forensic telemetry
		// (e.g. cancelled or never matched to a driver). Do NOT fabricate a "completed"
		// trail — fake odometer/device/payment data on a trip that never happened is a
		// data-integrity hazard. The admin SPA renders a graceful "no forensic audit
		// available" state on 404. (Previously this path returned a hardcoded simulated
		// dataset — removed.)
		http.Error(w, "no_forensic_audit_trail", http.StatusNotFound)
		return
	}

	// Hardware state comes from the last real GPS-trail ping. device_model / app_version
	// are not captured by the platform, so they are omitted rather than invented.
	hardware := map[string]interface{}{}
	var battery int
	var networkType string
	if err := h.dbPool.QueryRow(ctx, `
		SELECT COALESCE(battery, 0), COALESCE(network_type, '')
		FROM orders_gps_trail WHERE order_id = $1::uuid ORDER BY captured_at DESC LIMIT 1
	`, orderID).Scan(&battery, &networkType); err == nil {
		hardware["battery_pct"] = battery
		if networkType != "" {
			hardware["network_type"] = networkType
		}
	}

	trail := ForensicAuditTrail{
		OrderID:  orderID.String(),
		DriverID: driverID.String(),
		OfferTimestamps: map[string]interface{}{
			"received_ts":      offerReceived,
			"responded_ts":     offerResponded,
			"action":           offerResolution,
			"decline_reason":   declineReason,
			"response_latency": responseLatencyMs,
		},
		OdometerInputs: map[string]interface{}{
			"start_km":                 startOdo,
			"end_km":                   endOdo,
			"total_distance_travelled": endOdo - startOdo,
			"start_fuel_pct":           startFuel,
			"end_fuel_pct":             endFuel,
			"otp_attempts":             otpAttempts,
		},
		RouteMetrics: map[string]interface{}{
			"arrival_at":         arrivalAt,
			"trip_started_at":    tripStartedAt,
			"trip_ended_at":      tripEndedAt,
			"wait_time_minutes":  waitMin,
			"idle_time_minutes":  idleMin,
			"route_deviations_m": deviationMeters,
		},
		HardwareState: hardware,
		// Real fare from order_fare_breakdowns (paise). No hardcoded amounts.
		FinalInvoice: map[string]interface{}{
			"currency":              "INR",
			"base_fare_paise":       baseP,
			"distance_fare_paise":   distP,
			"night_charge_paise":    nightP,
			"total_collected_paise": totalP,
			"payment_confirmed":     paymentConfirmedAt != nil,
			"payment_method":        paymentMethod,
		},
		CapturedAt: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(trail)
}
