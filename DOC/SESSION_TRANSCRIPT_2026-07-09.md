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

> **DONE 2026-07-09 (items 1–6, commits `2ca94ba`→`a13439db`):** FCM
> dispatcher, scheduled-booking flow, referral attribution, document-expiry
> job, payout state machine, and onboarding restyle+real-progress all
> shipped; P6 QA walked 360/768/1024. Notes appended per item. Items 7–10
> remain open.

1. ~~**FCM push dispatcher (backend).**~~ ✅ `2ca94ba`. Real FCM HTTP v1
   sender (`internal/notification/fcm_http_sender.go`, service-account JWT via
   x/oauth2/google; `FCM_SERVICE_ACCOUNT_FILE` env, stub fallback). Dead
   tokens fail terminally + drop. Offer push queued at matcher assignment.
   **Lookout:** a real Firebase service-account JSON must be placed on the VM
   and `FCM_SERVICE_ACCOUNT_FILE` set (see `.env.example` §12) — until then
   pushes are logged, not delivered.
2. ~~**Scheduled-booking accept/decline flow.**~~ ✅ `257e08e6`. GET/accept/
   decline `/driver/scheduled-offers`, guarded CREATED→ASSIGNED, per-driver
   declines, GetOffer excludes committed far-future trips, T-60/T-15
   reminders in the dispatch scheduler. Client Trips tab now actionable.
   Migration `000125`.
3. ~~**Referral attribution.**~~ ✅ `257e08e6`. `driver_referrals` table +
   `drivers.referral_code` (migration `000124`, collision-safe backfill),
   register accepts `referred_by_code`, `/driver/referrals` returns real
   counts. Client register form has an optional code field.
4. ~~**Document expiry job.**~~ ✅ `2ca94ba`. `DocumentExpiryJanitor`
   (advisory lock 911003, nightly) flips **`vehicle_documents`** (NOT
   driver_documents — that table has no expiry_date) to EXPIRING/EXPIRED +
   queues a push. `DOC_EXPIRY_INTERVAL_HOURS` env.
5. ~~**Payout rails state machine.**~~ ✅ `2ca94ba`. `SandboxPayoutWorker`
   (lock 911004, `PAYOUT_SANDBOX_AUTOSETTLE=true`) advances **`payout_requests`**
   (the real table; `payout_history` was only a JSON key) PENDING→PROCESSING
   →PAID + settled push, never touching admin-claimed rows. Turn off once a
   real PSP lands.
6. ~~**Onboarding restyle + real upload progress.**~~ ✅ `85a0511c`. Real
   presigned-PUT byte progress (`uploadDocumentPresigned`, XHR
   upload.onprogress, falls back to proxied upload) + full Aura restyle.
   P6 fix `a13439db`: onboarding had the same pre-hydration `/login` bounce
   as AuthGuard (it sits outside the guard) — added a `hasHydrated` gate.
7. ~~**Landing / privacy / terms pages** dark marketing shells.~~ ✅ `e8d8566`.
   All three restyled to Aura (white/forest/sage, flat cards, serif headline,
   dark backdrop divs deleted). `share`/`sos` were already Aura.
8. ~~**Profile bio default** hardcoded.~~ ✅ `4d57811`. bio column already
   existed (`000107`) and PATCH already persisted it; the gaps were `/driver/me`
   not returning bio and the page seeding a fake default. Both fixed — bio now
   round-trips, empty-state prompt instead of marketing copy.
9. ~~**Admin panel audit.**~~ ✅ No-op — the transcript note was wrong.
   `VITE_FCM_VAPID_KEY` **does not exist** in `frontend/` (no FCM/web-push code
   at all), and there are **no fake buttons** (every `alert()` follows a real
   fetch; admin login hits the real endpoint). Only placeholder is
   `VITE_GOOGLE_MAPS_API_KEY=your_key_here` in `.env.example` — correct for a
   template; the real key lives in the per-machine `.env`.
10. ~~**Test coverage.**~~ ✅ `e4a2f37`. Go handler tests for scheduled-offers
    (auth/validation branches), upcoming-trips guard, and `referralCodeFor`
    determinism/uniqueness; client MSW tests for the new scheduled-offers +
    upcoming API. Note: the Go suite is nil-pool/pre-DB-branch style (no
    DB-backed harness exists in the repo), so query-path coverage for the new
    endpoints would need a pgxmock/testcontainers harness introduced first.

## Also fixed this session
- **Heatmap SSE 502 + console spam** (`946deb9`). Gateway `ANALYTICS_SSE_URL`
  was unset in compose → defaulted to `localhost:8089` (the gateway itself)
  → 502 on every heatmap connect; pointed it at `spatial-analytics:8089`.
  Client `EventSource.onerror` spammed `console.error` with empty `{}` on
  every transient reconnect — now quiet, single warning only after 5
  consecutive failures with the stream CLOSED.

## 4. Environment notes (bit-rot risks)
- VM repo path is `/home/itine/Vahnly` (no second "a" — differs from the
  local `Vahanly` folder). Deploy = `git pull && docker compose build
  public-gateway && docker compose up -d public-gateway`.
- `client-app/.env.local` is per-machine (gitignored): Firebase config,
  VAPID key. `DRIVER_APP_OPEN_ISSUES.md` records the working values.
- `graphify` CLI not installed on this machine — knowledge graph in
  `graphify-out/` is stale relative to all of the above.
  **Update 2026-07-09:** graph refreshed on the office machine (has the CLI).
- New migrations `000124` (driver referrals) + `000125` (scheduled offers)
  must run on any DB before the new endpoints work. The db-migrator bakes
  migrations into its image (no volume mount), so `docker compose build
  db-migrator` is required before it picks up new migration files.
- New env vars (`.env.example` §12): `FCM_SERVICE_ACCOUNT_FILE`/`_HOST_DIR`,
  `PAYOUT_SANDBOX_AUTOSETTLE`, `DOC_EXPIRY_INTERVAL_HOURS`. The three new
  workers all run inside the existing `outbox-notification-engine` service.
- Local QA login needs a seeded driver with a password (seed drivers have
  none) AND the client dev server on **:3000** (gateway CORS allowlist —
  :3050 is rider, :5173 is admin; other ports fail with net::ERR_FAILED).
