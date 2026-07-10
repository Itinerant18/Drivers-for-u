# Remaining Dispatch Bugs & Flows — Fix Plan (2026-07-10)

Source: verified multi-agent audit of the "booking never reaches driver" issue + live prod
reproduction. The external RCA's critical claims #1/#2/#3 were **refuted** against real source;
the true root causes were found and fixed in commit `04955586`:

- `order_consumer.go` — non-ErrNoRows assignment-commit failures were silently swallowed
  (no log/metric/requeue; order stuck CREATED forever).
- `stale_pruner.go` — GPS-staleness sweep flipped `current_state=OFFLINE` but left
  `duty_state=ONLINE`, producing zombie-online drivers that could never be matched.

Everything below is what remains, ordered by user impact.

---

## Phase 0 — In flight / immediate

### 0.1 Verify deploy of `04955586`
- VM Deploy run `29070595103` (github.com/Itinerant18/Vahnly/actions/runs/29070595103).
- Confirm on VM: `dispatch_matcher_prod` + `dispatch_pruner_prod` restarted from new image.

### 0.2 One-time prod data repair
Pre-fix damage: driver `94870a01-eefd-4e93-befb-c664ca1e80af` is `duty_state=ONLINE /
current_state=OFFLINE`. Pruner fix only prevents future desyncs.
```sql
UPDATE drivers SET duty_state='OFFLINE'
WHERE duty_state='ONLINE' AND current_state='OFFLINE';
```

### 0.3 End-to-end retest (human)
Phone with location granted → driver.aniket.site → Go Online (no red GPS banner) →
book from rider.aniket.site with pickup near the phone's real location → offer popup
should arrive in ~10-15s. This is the final proof of the platform's core purpose.

---

## Phase 1 — Offer-delivery resilience (highest value)

### 1.1 Offer poll fallback (client)
Audit's strongest open finding: the WS AssignmentFrame is load-bearing with **no safety
net** — one silently-dropped frame and an idle-online driver never sees the offer (recovery
only via reconnect or off/on toggle).
- File: `client-app/src/app/driver/page.tsx`
- Add `getPendingOffer(token)` poll every ~10s while duty state is ONLINE and no offer/trip
  is active. Kill the interval on offline/unmount.

### 1.2 Client duty-state reconciliation
After the pruner (rightly) forces a driver OFFLINE server-side, the app still shows "Online"
until manual refresh.
- Piggyback the existing 30s stats interval: also fetch server duty_state; if server says
  OFFLINE while UI says Online → flip UI, toast "You were taken offline (GPS signal lost).
  Go online again when ready."

### 1.3 FCM foreground handler
Token registration exists (`notifications.ts`) but there is **no `onMessage` handler**, so a
push cannot trigger the offer popup even in foreground.
- Add `onMessage` → on `OFFER_ASSIGNED`-type payload call `getPendingOffer` → `setOffer`.
- Background/service-worker push (app closed) = bigger job, explicitly deferred.

---

## Phase 2 — Cleanups (prevent the next false RCA)

### 2.1 Delete orphan `ResilientWebSocketProvider.tsx`
`client-app/src/lib/providers/ResilientWebSocketProvider.tsx` — zero imports anywhere,
already misled one external audit into "critical bug" claims. Delete file + its
`useWebSocket` export.

### 2.2 Fix misleading comment in `driver/page.tsx` (~544-547)
Comment claims sessions are keyed `driver:{id}` and cites dead line numbers
(handler.go:270/292/364). Reality: server keys `driverSessions` by bare authenticated
driver UUID from the WS ticket; client `order_id` only needs to be non-empty. This comment
seeded false RCA claim #1 — rewrite it accurately.

### 2.3 docker-compose healthcheck for matching-engine
`matching-engine` service has no `healthcheck:` block (unlike kafka/redis/triton/minio), so
Docker cannot flag/restart a dead matcher. The binary already runs an HTTP health server on
METRICS_PORT (:8080) — wire it:
```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:8080/health"]
  interval: 30s
  timeout: 5s
  retries: 3
```
(Verify the runtime image has wget/curl; scratch images may need the Go binary's own probe
or a compose `start_interval` alternative.)

---

## Phase 3 — Hardening (lower urgency)

### 3.1 Store-and-replay max-age bound
`internal/rider/service/booking_service.go` (~line 633): the Kafka-outage fallback enqueues
into the scheduled-dispatch queue with **no max-age**, so a multi-hour outage replays stale
still-CREATED orders hours later. Add a max-age filter (e.g. skip/cancel if older than
~10 min) at replay time.

### 3.2 Empty `vehicle:""` in DUTY_ONLINE telemetry
Observed live on driver.aniket.site. Trace where the duty-toggle telemetry builds its
payload; determine whether the blank vehicle field is cosmetic or feeds matching/pricing.
Fix at the source (likely the driver profile fetch not including active vehicle).

### 3.3 Documentation
Update `DOC/DRIVER_APP_OPEN_ISSUES.md` + session transcript with:
- Refuted RCA claims (session key, ResilientWS provider, dispatch-not-running) + evidence.
- True root causes (silent commit-failure swallow; pruner duty/current desync) + fix commit.
- The GPS ground rule: only a driver with live GPS pings within the scanner's 30s window is
  matchable — desktop browsers without location are intentionally non-dispatchable.

---

## Phase 4 — From E2E report (test/e2e_test_report.md, 2026-07-10)

E2E proved the core flow live: booking → matching → WS offer delivery ✅ (6/6 offers reached
the driver popup). Acceptance unverified only because Playwright couldn't simulate the slide
gesture within 15s — a tooling limit, not a platform bug.

### 4.1 Fallback Accept button (accessibility + testability)
Slide-to-accept is the only accept path. Add a plain "Accept" button alongside (a11y:
gesture-only controls fail WCAG). Keeps the slide as primary affordance.

### 4.2 Offer window: keep 15s, add audio/vibration alert
Report suggests 30s, but the lease is enforced in three synced places (Redis offer:lease,
expiry janitor, client countdown ring) — change all or none. Cheaper first step: fire the
existing vibration logic + a sound on offer arrival so 15s is actually usable by a human.

### 4.3 Terminology pass: ride-hailing → driver-hiring
~60% of UI copy says trips/rides/pickup. Mechanical find-and-fix across both apps:
- "ride requests" → "job requests" (driver GPS banner)
- "You declined a ride" → "...a job"
- "Trips" nav → "Jobs" (both apps)
- "0 trips" stat → "0 jobs"
- HTML meta "ride dispatch" → "driver dispatch"
- Rider: "One-Way · ₹X" dispatch summary → "Driver booking · ₹X"; drop "4 seats · 2 bags"
  from car categories (rider owns the car).

### 4.4 Rider "NONE availability" UX
Rider sees "NONE availability · ~15 min pickup" yet can still book (then gets the
all-drivers-busy timeout). Either block/warn before booking or reword honestly.

### 4.5 Verify /driver/offer during live lease
Report saw `{order:null}` while UI showed OFFER_PENDING — most likely their manual API call
came after the 15s lease expired (janitor rolls ASSIGNED back to CREATED). Verify with a live
lease before building 1.1's poll; if genuinely null during a live offer, the poll fallback
must consume a different signal.

---

## Execution notes
- Phase 1 is client-only → Firebase Hosting deploy (`vahnly-driver`), no VM deploy.
- Phases 2-3 mixed: 2.1/2.2 client, 2.3 compose (VM), 3.1 backend (VM), 3.2 TBD.
- Each item: build → test (Go: `go build ./...` + targeted tests; client: `tsc` + vitest) →
  deploy → verify live.
- Matcher metric to watch post-deploy: `dfu_orders_unmatched_total{reason="commit_failure"}` —
  new label added by `04955586`; any non-zero value means the old silent path is now visible.
