# Driver App — Full Redesign & Backend Implementation Plan (2026-07-09)

Goal: rebuild the driver app (`client-app/`) as a fully mobile-responsive,
category-competitive driver-partner product on the Aura design system
(forest/sage, Playfair display moments — already shipped as the token layer),
with the backend work needed so every screen runs on live data.

---

## 1. Research — what the category ships

Sources: [Uber's driver app case study](https://www.uber.design/case-studies/driver-app),
[Uber real-time earnings tracker](https://www.uber.com/en-IN/blog/real-time-earnings-tracker/),
[Uber driver map interface](https://www.uber.com/in/en/blog/building-a-scalable-and-reliable-map-interface-for-drivers/),
[DriveU Partner](https://play.google.com/store/apps/details?id=com.driveu.partner&hl=en_IN),
[Drivers4Me](https://play.google.com/store/apps/details?id=com.drivers4me&hl=en_IN),
[Book Your Driver Partner](https://play.google.com/store/apps/details?id=com.sc.bookyourdriverpartner&hl=en_US),
[DOH-Driver (Driver On Hire)](https://play.google.com/store/apps/details?id=com.driveronhire.deploy.driverapp&hl=en_IN).
(No app named "B4U" exists in the category; Drivers4Me / DriveU Partner are
the closest matches and what this plan benchmarks against.)

Category-converged patterns (Uber driver redesign + Indian driver-on-hire apps):

1. **Bottom tab bar, not a drawer.** Home (duty/map), Trips (upcoming +
   history), Earnings, Account. One thumb, zero hunting. Uber moved earnings/
   ratings/inbox out of buried tabs into this journey-based IA.
2. **Earnings as a first-class surface.** Real-time per-trip ticker, daily
   card, weekly bar chart, payout CTA — not a sub-page of "account".
3. **Trip Planner / agenda.** Upcoming scheduled bookings with date-grouped
   list; empty state suggests when/where to drive (demand forecast).
4. **Offer card discipline.** Full-screen takeover, big fare + distance-to-
   pickup + trip type, countdown ring, one-slide accept. (Vahnly has this.)
5. **Map layers.** Demand heat, surge zones, high-demand events as toggleable
   layers over one map. (Vahnly has heatmap; layers need the toggle UI.)
6. **Driver trust center.** Documents with expiry chips, insurance, training,
   SOS, emergency contact — one "safety & compliance" cluster.

## 2. Design principles (mobile responsive contract)

- **Breakpoints:** base = 360-430px phones (design target), `sm:` 640
  (large phones landscape), `md:` 768 (tablets → 2-column account, side
  panel trip details), `lg:` 1024 (desktop → sidebar + max-w-4xl content;
  already exists for account).
- Bottom tab bar ≤ `md`, converts to left rail ≥ `md`.
- Every interactive control ≥44×44; primary CTAs full-width, bottom-anchored,
  `env(safe-area-inset-bottom)` respected.
- No informational text below 12px; money/ETA in mono ≥16px.
- Map sheets: collapsed peek 96px, half 50%, full — draggable, never covering
  the primary CTA.
- Aura system everywhere (tokens.css is the only color source; Playfair only
  greeting/page titles; forest = action, sage = state/selection).

## 3. Information architecture (new)

```
[Tab bar]
├── Home      — map + duty toggle + bento (today) + active-trip flow overlays
├── Trips     — Upcoming (scheduled bookings, NEW) | History (existing)
├── Earnings  — daily ticker, weekly chart, payouts, incentives/quests
└── Account   — profile, vehicles, documents+expiry, training, safety
                (emergency contact, SOS settings), support, refer, settings
```

Trip-flow overlays (offer → navigate → arrive/OTP → in-trip → bill → rate)
stay state-driven on Home, exactly as today.

## 4. Screen-by-screen redesign

| Screen | Change | Size |
|---|---|---|
| Shell | NEW bottom tab bar (4 tabs) replacing drawer; drawer content folds into Account | M |
| Home offline | bento (shipped) + demand-forecast tile ("busy 6-9pm near Salt Lake") | S |
| Home online | map + heat layer toggle chips; collapsed bento peek | M |
| Offer card | keep; add distance-to-pickup + payout estimate prominently | S |
| Trips → Upcoming | NEW date-grouped scheduled bookings, accept/decline, reminders | L |
| Trips → History | existing list restyled to Aura + filters | S |
| Earnings home | per-trip ticker (last trip card), day card, 7-day chart, payout CTA, quests strip | M |
| Payouts | bank state, instant-payout CTA, history — restyle + real rails states | M |
| Documents | expiry chips (VALID/EXPIRING/EXPIRED), re-upload via presigned flow | M |
| Safety center | SOS settings + emergency contact CRUD (needs backend) + insurance info | M |
| Onboarding | keep 7 steps; restyle to Aura; real upload progress | M |
| Settings | notification prefs, language (exists), dark-map toggle | S |

## 5. Backend implementation plan

Existing surface is broad (60+ driver routes — auth, duty, offers, trip
lifecycle, odometer, earnings/ledger, payouts, wallet, vehicles, documents,
training, support, notifications, referrals, incentives, performance, route
service, trip-share). Gaps to make the redesign fully live:

### 5.1 New endpoints
| Endpoint | Purpose | Notes |
|---|---|---|
| `GET /api/v1/driver/trips/upcoming` | Trip Planner: scheduled bookings assigned/offered to this driver | reads `orders.scheduled_at` (rider side already writes it); needs dispatch path for scheduled offers |
| `POST /api/v1/driver/scheduled/{id}/accept` + `/decline` | scheduled-booking commitment | new `scheduled_assignments` state or reuse offer-response with future window |
| `PATCH /api/v1/driver/profile/emergency-contact` | edit emergency contact post-onboarding | writes same `onboarding_data` JSONB keys `/me` now reads |
| `GET /api/v1/driver/city-config` | city name, operating hours, service area for the driver's `city_prefix` | thin driver-auth wrapper over `regional_cities` (same pattern as `HandleDriverRoute`) |
| `GET /api/v1/driver/demand-forecast` | offline-state suggestion tile | v1: aggregate `dispatch_match_logs` by hour×H3 into top-3 windows; cron-refreshed table |

### 5.2 Harden existing (verify real data, kill any stub rows)
- `GET /driver/incentives` — back quests with real tables
  (`driver_quests`, progress trigger on COMPLETED orders) instead of static rows.
- `GET /driver/performance` — compute compliments/reviews from
  `driver_review_*` columns already written by rate-rider.
- `GET /driver/referrals` — persist codes + attribution on register.
- Payout rails — real state machine on `payout_history`
  (PENDING→PROCESSING→PAID/FAILED worker), even if the PSP is sandboxed.
- Document expiry — nightly job flips `driver_documents` status to
  EXPIRING/EXPIRED from `expiry_date`; feeds Documents screen chips + push.

### 5.3 Push + realtime
- FCM server-side sender for: new offer (data+notification message), scheduled
  trip reminder (T-60/T-15), document expiry, payout settled. Device tokens
  already stored via `/driver/device-token`; needs a `notification_dispatcher`
  consumer on existing Kafka topics + FCM HTTP v1 key on the VM.
- WS frames already cover offer/cancel/chat — no change.

### 5.4 Infra
- `OSRM_BASE_URL` on the VM (docker-compose `osrm/osrm-backend` with an
  India extract, or hosted OSRM) so `/driver/map/route` returns road
  polylines instead of `LOCAL_FALLBACK` straight lines.
- Firebase Hosting stays for the frontend; gateway redeploy per backend phase.

## 6. Phases

| Phase | Scope | Deliverable |
|---|---|---|
| **P1 — Shell & IA** | Bottom tab bar + route restructure (`/driver`, `/driver/trips`, `/driver/earnings`, `/driver-account`), drawer retired, all screens reachable in ≤2 taps | frontend only |
| **P2 — Earnings surface** | Earnings home (ticker/day card/chart/payout CTA/quests strip); harden incentives+performance+referrals backends (5.2) | FE + BE |
| **P3 — Trip Planner** | Upcoming trips tab + scheduled accept/decline + reminders | FE + BE (5.1 rows 1-2, push T-reminders) |
| **P4 — Safety & compliance** | Safety center, emergency-contact CRUD, documents expiry chips + job, city-config | FE + BE (5.1 rows 3-4, 5.2 expiry) |
| **P5 — Map & demand** | Layer toggle chips, demand-forecast tile + endpoint, OSRM infra | FE + BE + infra |
| **P6 — Polish pass** | `/impeccable critique` on every tab at 360/768/1024, contrast audit, motion audit, onboarding restyle | frontend only |

Order rationale: P1 unlocks navigation for everything after; P2 is the
highest driver-retention surface; P3 is the biggest net-new feature; P4-P5
are independent and can swap.

## 7. Out of scope (explicitly)
- Rider app, admin panel (separate design systems).
- Native app packaging (Capacitor shell exists; unchanged).
- Real PSP integration for payouts (state machine yes, live money no).
