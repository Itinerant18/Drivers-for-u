package http

import (
	"context"
	stdhttp "net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/platform/driver-delivery/internal/gateway/middleware"
)

// driverCtx returns a request context carrying a DRIVER identity, matching what
// AuthenticateJWT injects in production.
func driverCtx(base context.Context, driverID string) context.Context {
	ctx := context.WithValue(base, middleware.UserIDContextKey, driverID)
	return context.WithValue(ctx, middleware.UserRoleContextKey, "DRIVER")
}

func TestScheduledOffers_RequireDriverIdentity(t *testing.T) {
	// No identity on the context → 401 before any DB access (safe with nil pool).
	cases := []struct {
		name    string
		method  string
		path    string
		handler func(*GatewayHandler) stdhttp.HandlerFunc
	}{
		{"list", stdhttp.MethodGet, "/api/v1/driver/scheduled-offers",
			func(h *GatewayHandler) stdhttp.HandlerFunc { return h.HandleDriverGetScheduledOffers }},
		{"accept", stdhttp.MethodPost, "/api/v1/driver/scheduled-offers/o1/accept",
			func(h *GatewayHandler) stdhttp.HandlerFunc { return h.HandleDriverAcceptScheduledOffer }},
		{"decline", stdhttp.MethodPost, "/api/v1/driver/scheduled-offers/o1/decline",
			func(h *GatewayHandler) stdhttp.HandlerFunc { return h.HandleDriverDeclineScheduledOffer }},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			handler := &GatewayHandler{}
			req := httptest.NewRequest(c.method, c.path, nil)
			rec := httptest.NewRecorder()
			c.handler(handler)(rec, req)
			if rec.Code != stdhttp.StatusUnauthorized {
				t.Fatalf("expected 401 without a driver identity, got %d", rec.Code)
			}
		})
	}
}

func TestScheduledOffers_WrongRoleForbidden(t *testing.T) {
	handler := &GatewayHandler{}
	req := httptest.NewRequest(stdhttp.MethodGet, "/api/v1/driver/scheduled-offers", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "rider-1")
	ctx = context.WithValue(ctx, middleware.UserRoleContextKey, "RIDER")
	rec := httptest.NewRecorder()

	handler.HandleDriverGetScheduledOffers(rec, req.WithContext(ctx))

	if rec.Code != stdhttp.StatusForbidden {
		t.Fatalf("expected 403 for a non-driver role, got %d", rec.Code)
	}
}

func TestScheduledOfferAccept_MissingOrderID(t *testing.T) {
	// A valid DRIVER but no {id} path value (httptest doesn't run the ServeMux
	// pattern) → 400 before the handler touches the DB.
	handler := &GatewayHandler{}
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/v1/driver/scheduled-offers//accept", nil)
	rec := httptest.NewRecorder()

	handler.HandleDriverAcceptScheduledOffer(rec, req.WithContext(driverCtx(req.Context(), "driver-1")))

	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for a missing order id, got %d", rec.Code)
	}
}

func TestScheduledOfferDecline_MissingOrderID(t *testing.T) {
	handler := &GatewayHandler{}
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/v1/driver/scheduled-offers//decline", nil)
	rec := httptest.NewRecorder()

	handler.HandleDriverDeclineScheduledOffer(rec, req.WithContext(driverCtx(req.Context(), "driver-1")))

	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for a missing order id, got %d", rec.Code)
	}
}

// Upcoming trips and referrals both go straight to a DB query after the
// identity check, so only the pre-DB auth branch is unit-testable here.
func TestUpcomingTripsAndReferrals_RequireIdentity(t *testing.T) {
	handler := &GatewayHandler{}
	for _, tc := range []struct {
		name string
		fn   stdhttp.HandlerFunc
		path string
	}{
		{"upcoming", handler.HandleDriverGetUpcomingTrips, "/api/v1/driver/trips/upcoming"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(stdhttp.MethodGet, tc.path, strings.NewReader(""))
			rec := httptest.NewRecorder()
			tc.fn(rec, req)
			if rec.Code != stdhttp.StatusUnauthorized {
				t.Fatalf("%s: expected 401 without identity, got %d", tc.name, rec.Code)
			}
		})
	}
}
