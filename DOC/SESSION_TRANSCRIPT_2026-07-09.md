# Driver App Work Transcript — 2026-07-08 → 2026-07-09

Running record of the driver-app overhaul: what shipped, what to watch, what
still needs fixing. Companion docs: `DRIVER_APP_OPEN_ISSUES.md` (login-debug
session), `DRIVER_APP_REDESIGN_PLAN.md` (the plan this executes).

---

## 1. DONE — shipped and deployed

All commits pushed to `main`, frontend live on Firebase Hosting
(`vahnly-driver.web.app` / `driver.aniket.site`), gateway rebuilt on the GCP
VM (`dfu-stack`, repo path `/home/itine/Vahnly` — note spelling).

### Bug/flow fixes
| Commit | What |
|---|---|
| `4a020ea` | Dead `/api/v1/city-config` fetch removed (404 every page load); fake Apple Sign-In button removed |
| `49b2456` | **Payment settlement wired to backend** (bill page now calls confirm-payment: payment intent + double-entry ledger); fake/mock bills removed (end-trip failure keeps trip live); real device GPS for duty-online, SOS, map marker; `/share` wired to public trip-share API; odometer photo real presigned upload; offer chime+vibration; chat stubs wired; demo booking button removed; fare dispute files real support ticket; **new `POST /api/v1/driver/map/route`** + road polyline on the in-trip map |
| `738a32f`+`479caab` | All browser `alert()`s → design-system toasts; duplicate settlement pane unified into resume-card → bill page; placeholder identities (Aniket/drv-aniket-7602) and hardcoded plates removed; **emergency contact exposed via `/driver/me`** (onboarding JSONB) and consumed by the SOS console |
| `e4bc768` | Dead `CompletedPane` + orphaned plumbing deleted (−222 lines); "Serviced Cities" static copy → live city prefix |

### Design system (Aura)
| Commit | What |
|---|---|
| `d5c3353` | Full Aura adoption per `aura-mobile-flow-4-DESIGN.md`: white canvas, forest `#2C3B31` primary, sage `#7A9E7E` accent (text-safe `#435F48`), ink `#111827`, Playfair Display for display moments only, single 8px card radius; black-terminal screens (shell, bill, rate, share) rebuilt; bento dashboard (serif greeting, forest earnings hero tile, sage stat tiles); account section swept for white-on-white breakage; map cartography moved to forest/sage |

### Redesign plan execution (P1–P5)
| Commit | Phase | What |
|---|---|---|
| `28a6033` | — | `DRIVER_APP_REDESIGN_PLAN.md` (research: Uber driver case study, DriveU Partner, Drivers4Me; no "B4U" app exists) |
| `6099ae9` | P1 | Bottom tab bar IA (Home/Trips/Earnings/Account); drawer deleted; `/driver/trips` + `/driver/earnings` routes |
| `c5b849e` | P2–P4 | Quests strip on Earnings (live incentive campaigns); **`GET /driver/trips/upcoming`** + Upcoming tab; **`PATCH /driver/profile/emergency-contact`** + Settings editor; **`GET /driver/city-config`** (city name + operating hours on profile) |
| `be04b7d` | P5 | **`GET /driver/demand-forecast`** (busiest hours, 14-day IST histogram) + offline "busiest hours" tile |

### Verified
- `go build ./...` + `go vet` clean; Next build clean; 25/25 client tests pass.
- All new endpoints answer `401` unauthenticated on the VM (live, JWT-gated).
- Live site fetch confirms deploys (Apple button gone, app renders).

---

## 2. LOOKOUT — decisions / verification needed

1. **OSRM routing env — BLOCKED ON A DECISION.** `OSRM_BASE_URL` is unset on
   the gateway, so `/driver/map/route` returns straight-line fallbacks.
   Options: (a) public demo `https://router.project-osrm.org` (instant,
   rate-limited — command in chat history, must be run by a human), or
   (b) self-hosted `osrm/osrm-backend` with a West Bengal Geofabrik extract
   (~200MB pbf, ~1-2GB RAM) on the VM. Auto-mode is correctly barred from
   writing prod config overrides.
2. **P6 visual QA not done.** Dashboard/trip-flow/bill screens are
   auth-gated; nobody has eyeballed the Aura restyle or tab bar on a real
   phone (360px), tablet (768), desktop (1024). Walk the app with a driver
   account: contrast, Playfair sizing, tab-bar/sheet overlap, greeting
   hydration, quest strip overflow.
3. **Domain split** (`vahnly-driver.web.app` vs `driver.aniket.site` — both
   registered on the same Hosting site). Sessions live in localStorage per
   origin: a driver bouncing between domains gets logged out. Pick ONE
   canonical domain and redirect the other. Original "spontaneous jump"
   (OPEN_ISSUES #1) still unexplained — likely browser autocomplete; retest.
4. **Public OSRM latency vs 900ms client timeout** in the map handler —
   if option (a) is chosen, watch the `MAP_OSRM_FALLBACK` log rate.
5. **Demand forecast quality** — citywide hour histogram v1; revisit with
   per-H3-zone aggregation once order volume justifies it.

---

## 3. FIX NEXT — known gaps, ordered

1. **FCM push dispatcher (backend).** Device tokens are stored
   (`/driver/device-token`) and the web VAPID key is real, but no service
   sends pushes. Needed for: new-offer alerts when the app is backgrounded,
   scheduled-trip reminders, document expiry, payout settled. Kafka consumer
   + FCM HTTP v1 sender.
2. **Scheduled-booking accept/decline flow.** Upcoming tab is read-only v1
   (shows early/force-matched assignments). Full Trip Planner needs an
   advance-commitment flow (offer scheduled orders days ahead, accept →
   locked assignment + T-60/T-15 reminders).
3. **Referral attribution.** `/driver/referrals` returns a deterministic
   code with honest zeros; registration flow doesn't capture referral codes,
   so joined/pending/earnings never move.
4. **Document expiry job.** `driver_documents.expiry_date` exists but no
   nightly job flips VALID→EXPIRING→EXPIRED; Documents screen chips + expiry
   pushes depend on it.
5. **Payout rails state machine.** `payout_history` statuses exist; no
   worker advances PENDING→PROCESSING→PAID/FAILED (PSP can stay sandboxed).
6. **Onboarding restyle + real upload progress** (still pre-Aura visuals;
   progress bar is a fake setInterval around the real upload).
7. **Landing / privacy / terms pages** still the old dark marketing shells —
   intentional exclusion, but they now clash with the Aura app; brand-register
   redesign pass when priorities allow.
8. **Profile bio default** is hardcoded marketing copy until the driver
   edits it; backend has no bio read column surfaced in `/driver/me`.
9. **Admin panel (frontend/)** untouched by all of this — `VITE_FCM_VAPID_KEY`
   still a placeholder there; unknown fake-button debt (never audited).
10. **Test coverage.** New endpoints (route, upcoming, emergency-contact,
    city-config, demand-forecast) have no Go handler tests; client has no
    tests for the new tab pages.

## 4. Environment notes (bit-rot risks)
- VM repo path is `/home/itine/Vahnly` (no second "a" — differs from the
  local `Vahanly` folder). Deploy = `git pull && docker compose build
  public-gateway && docker compose up -d public-gateway`.
- `client-app/.env.local` is per-machine (gitignored): Firebase config,
  VAPID key. `DRIVER_APP_OPEN_ISSUES.md` records the working values.
- `graphify` CLI not installed on this machine — knowledge graph in
  `graphify-out/` is stale relative to all of the above.
