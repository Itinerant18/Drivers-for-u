package http

import (
	"strings"
	"testing"
)

// referralCodeFor must be deterministic (same driver id → same code) and follow
// the DRV + 5-char shape the migration backfill and register handler mirror.
func TestReferralCodeFor_Deterministic(t *testing.T) {
	id := "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

	got := referralCodeFor(id)
	if got != referralCodeFor(id) {
		t.Fatal("referralCodeFor is not deterministic for the same id")
	}
	if !strings.HasPrefix(got, "DRV") {
		t.Fatalf("expected a DRV-prefixed code, got %q", got)
	}
	if len(got) != 8 { // "DRV" + 5 hex chars
		t.Fatalf("expected an 8-char code, got %q (len %d)", got, len(got))
	}
	if got != strings.ToUpper(got) {
		t.Fatalf("expected an uppercase code, got %q", got)
	}
}

func TestReferralCodeFor_DiffersByDriver(t *testing.T) {
	a := referralCodeFor("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
	b := referralCodeFor("b1ffcd00-1234-5ef8-cc7e-7cc0ce491b22")
	if a == b {
		t.Fatalf("expected distinct codes for distinct drivers, both were %q", a)
	}
}
