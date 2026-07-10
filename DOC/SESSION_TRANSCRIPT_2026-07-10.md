# Session Transcript — 2026-07-10

Full-day log of work on the Vahnly driver platform. Eight commits, two backend/VM
deploys implied by earlier fixes, one Firebase Hosting deploy of the driver app at
the end of the day.

---

## 1. Dispatch root-cause fix (morning) — `04955586` @ 10:36

**Problem:** rider books on rider.aniket.site → driver.aniket.site receives no
offer. The platform's core purpose was broken.

**Root causes found (two independent bugs):**

1. `internal/dispatch/consumer/order_consumer.go` — non-`ErrNoRows` failures in
   `commitAssignmentTransaction` were silently swallowed (bare `return`). Orders
   died with no log, no metric, no requeue.
2. `internal/telemetry/pruner/stale_pruner.go` — the GPS-staleness pruner set
   `current_state = 'OFFLINE'` but left `duty_state = 'ONLINE'`. Driver app showed
   ONLINE; the matcher saw OFFLINE. Every writer except the pruner updated both
   columns together.

**Fix:** commit failures now log + increment `orders_unmatched_total{commit_failure}`
+ requeue; pruner updates both state columns atomically. Deployed via the VM Deploy
workflow; verified live with a Redis-injected driver location and a real booking.

## 2. Offer-delivery resilience + tap-accept — `858c716c` @ 12:45

Three independent delivery paths so one dropped signal can't strand a driver:

- WebSocket (primary, unchanged)
- 10-second `GET /driver/offer` poll while ONLINE (new)
- FCM foreground `onMessage` handler → re-fetch pending offer (new;
  `attachForegroundPushHandler` in `services/notifications.ts`)

Plus: 30s profile reconciliation with a forced-offline toast (pruner honesty),
plain-tap **Accept job** button beside slide-to-accept (WCAG 2.5.1), and two real
z-index bugs fixed in OfferPopup (takeover clipped under sticky header).

## 3. Developer-cruft removal — `bdd06a6a`, `f1c7f764` @ ~12:52

- Telemetry log console gated to `NODE_ENV === 'development'`.
- "VAHNLY · ENCRYPTED WS · TELEMETRY ACTIVE" footer deleted outright.

## 4. Mobile-first dashboard pass — `80095fd2` @ 13:24

Full 360px pass on the legacy dashboard: single priority-banner slot (replacing 5
stacked `fixed top-0` banners), simplified header, icon-only heatmap toggle,
collapse-behind-summary stats, `FareDisplay` overflow fix on the offer tile.
Verified with 360px Playwright screenshots of every driver screen.

## 5. Icons8 3D-fluency icon set — `273c9cb2` @ 15:28

User-driven migration verified and repaired: `ds/Icons8.tsx` factory
(`makeIcon(slug)` → `/icons8/{slug}.png`, 54 local PNGs, all slugs accounted for),
support/vehicles/wallet/layout pages swapped to `*Icon3D` components. Local build
verified before commit+deploy per user instruction.

## 6. Docs cleanup + E2E report — `ba55f661` @ 15:32

Superseded fix prompts deleted; independent Playwright E2E report committed
(booking → matching → WS offer delivery confirmed 6/6 after the morning fix).
`DOC/DRIVER_APP_OPEN_ISSUES.md` working-tree revert **held back** — it undoes
documented fixes from `4a020ea9`; awaiting a discard/keep decision.

## 7. Aura mobile redesign: repair → preview → promote — `206cd56e` @ 18:20

The big one. A 15-screen mobile redesign spec (Aura design system: `#2C3B31`
primary, `#7A9E7E` accent, Playfair/Inter/JetBrains Mono) arrived with scaffolded
components that didn't compile (33 type errors against imagined store APIs).

**Repair:**
- `ds/index.tsx` duplicate → `ds/redesign.tsx` (redesign-only ds variants, kept
  separate from the legacy barrel: rupee vs paise FareDisplay, different
  StatusBadge API).
- OfferScreen mapped to the real `OrderOffer` (paise conversion, `pickup.address`,
  `carMake/carModel/carTransmission`).
- Home orchestrator rewritten against the real `useDriverDutyStore` state machine
  + `activeOrder` instead of a fictional `useTripStore.tripState`.
- SosFloatingButton wired to the real `triggerSOS(lat, lng, orderId)`.

**Preview:** wired at `/driver/redesign` + `/driver/jobs`, QA'd at 360px with
headless Chrome (the Playwright MCP died mid-session; fell back to a
`playwright-core` script driving system Chrome). Caught and fixed: SOS float
overlapping primary CTAs, tab bar covering the complete-screen CTA, zero-value
artifacts (★ 0.0, 0.0 km, dangling separators).

**Promotion (user-approved):** redesign render swapped into `/driver` itself for
**OFFLINE, ONLINE and OFFER_PENDING** states — HomeOffline + HomeOnline +
OfferScreen + TabBarRedesign — while keeping every line of service plumbing
(WebSocket, telemetry stream, offer poll, reconciliation, GPS watch, the
offer-ACCEPTED → activeTrip effect).

**Deliberate carve-out:** EN_ROUTE/ARRIVED/DELIVERING/COMPLETED keep the legacy
DriverTripManager panes. The redesigned trip screens have no odometer/fuel/OTP
capture, and fares are computed from the odometer delta — promoting them now would
corrupt billing. They ship as components only, pending parity work.

Preview route deleted after promotion. Final QA at 360px against the production
API exercised the **real accept path** (only the respond call stubbed): offer
takeover → NavigationPane → ArrivedVerificationPane (odometer + OTP intact) →
TripInProgressPane all rendered correctly.

**Deployed:** pushed to GitHub (`206cd56e`), built and released to Firebase
Hosting (`vahnly-driver` → https://driver.aniket.site).

---

## Open items

1. `DOC/DRIVER_APP_OPEN_ISSUES.md` — uncommitted revert, needs discard/keep call.
2. Trip-flow redesign promotion — blocked on adding odometer/fuel/OTP capture to
   `components/trip/*` screens.
3. Redesigned EarningsScreen + `components/account/*` screens — compile-clean but
   unwired (`/driver/earnings` and driver-account pages still legacy).
4. Remediation plan phases 2–4 (`prompt/04-Fix-Remaining-Dispatch-Bugs-Plan.md`):
   orphan `ResilientWebSocketProvider` cleanup, store-and-replay max-age bound,
   ride→job terminology pass, NONE-availability UX, live-lease `/driver/offer`
   verification.
