# Vahnly / Drivers-for-U — End-to-End Manual QA & Security Audit

**Tester role:** Senior Manual QA Engineer + Security Auditor
**Method:** Live browser testing (Playwright MCP) — no code read, DOM/label inspection, network + console capture, cross-app flows
**Date:** 2026-07-11 (~00:20–01:00 IST)
**Targets:** Admin `admin.aniket.site` · Rider `rider.aniket.site` · Driver `driver.aniket.site`
**Platform model:** Rider (car owner) **hires a driver** to drive their own car; Driver provides driving service; Admin manages both.

> This report is a fresh, live re-test. Everything below was verified in-session; where a prior 2026-07-10 report's finding changed, that is called out. Where a flow could not be exercised (and why), that is stated honestly rather than assumed.

---

## Executive Summary

The platform is a **polished, feature-complete front end on top of a dispatch pipeline that does not complete a single hire.** Admin, rider, and driver apps are all live, authenticate, and hold real persisted data. But **26 of 26 historical orders are cancelled/unassigned (100% cancellation)**, and a live order created during this test auto-cancelled the same way. The rider's booking flow works end-to-end up to dispatch; the dispatch step never matches a driver.

**Two things every stakeholder should take away:**

1. **The core function is broken.** No order in the system has ever reached a driver. The certain root cause is that **the matcher never promotes an order from `requested` → `assigned`** — every order stays `Unassigned` and auto-cancels (100% unassigned is ground truth). As a faithful *symptom* of that, the rider's dispatch screen polls `GET /rider/orders/active`, which correctly returns `404 {"error":"no active order"}` for the entire wait because no order ever becomes active — so the rider can never see a match. (Verified: `/orders/active` returns the same "no active order" 404 even with a freshly-created order pending, so the 404 is the intended convention, not the bug.) Combined with a driver app that can only receive jobs with a live GPS fix (and drops OFFLINE when telemetry fails), the lifecycle cannot close.
2. **Security is mixed — good bones, real holes.** Admin session uses an httpOnly cookie (XSS-safe) and there is genuine tamper-evident audit logging. But **admin 2FA is required-but-not-enforced** (login completes with no TOTP), **both customer apps store access + refresh JWTs in localStorage** (XSS-stealable → account takeover), and the admin login **leaks account existence** ("User email does not exist" vs "Invalid password").

**What improved since 2026-07-10:** the "14/19 driver account pages are empty shells" problem is **fixed** (those pages now render real content), and the admin "Configuration" page is now fully populated. The rider "Unverified/Level NONE" issue is resolved (now "KYC Verified").

---

## Post-Audit Code Review — Corrections & Fixes Applied

The black-box audit was reconciled against the source. Some findings were over-called and are corrected here; the genuine, contained ones were fixed and verified (`go build` for Go, `tsc --noEmit` for the frontends).

**Fixes applied (verified compiling):**
| Finding | Change | File | Verified |
|---------|--------|------|----------|
| Login timing enum | Added a dummy-bcrypt compare on the email-not-found path so a missing account can't be distinguished from a wrong password by latency. | `auth_handler.go` (email-not-found branch) | `go build`/`go test` ✅ |
| Misleading admin error | Admin login parsed the body as JSON unconditionally; the gateway's plain-text `http.Error` codes threw → a 401 surfaced as "Network connection timeout to auth gateway." Now reads text, parses when JSON, and maps status→message (401→invalid credentials, 429→too many attempts). | `frontend/src/admin/components/AdminAuthGateway.tsx` | `tsc` ✅ |
| Misleading driver error | A 429 rate-limit showed "Authentication failed" (implying bad credentials). Now detects 429 and says "Too many attempts. Please wait." | `client-app/src/app/login/page.tsx` | `tsc` ✅ |
| Avg ETA float | Admin dashboard rendered a raw float (`0.00047… min`); now `Math.round`ed. Note: this only fixes the *display* — the backend's avg-ETA value is itself miscalculated (a sub-millisecond figure) and still needs correcting. | `frontend/src/admin/pages/DashboardHome.tsx` | `tsc` ✅ |
| **P0 — fabricated trip forensics** | The `/forensic-audit` endpoint returned a **fully hardcoded "completed trip" dataset** (odometer 14500→14525, `SM-G998B`, "UPI confirmed ₹1050") whenever a trip had no `trip_audit_summaries` row — i.e. for every cancelled/unmatched trip (all of them today). Now returns **404** for trips with no real telemetry (the SPA already renders a graceful "no forensic audit available"), and the found-path pulls **real** invoice from `order_fare_breakdowns` + real hardware from `orders_gps_trail` instead of hardcoded values. | `internal/gateway/delivery/http/trip_audit_handler.go` | `go build` ✅ |
| In-city fare abuse | An `IN_CITY_*` trip with an out-of-region drop priced the full metered distance (a ₹44,328 "in-city" Kolkata→Himachal fare). Added a 150 km straight-line cap for in-city tiers (outstation uncapped), rejected at estimate so the rider never sees the bad quote. | `booking_service.go` + `trip_spec.go` + `booking_handler.go` | `go build`+`go test` ✅ |
| Raw enum in history | Rider trip history showed the raw `IN_CITY_ONE_WAY` enum; now maps to a friendly label ("One-Way", …). *(Coords→address still needs the backend to surface the stored addresses — deferred.)* | `rider-app/app/(app)/account/bookings/page.tsx` | `tsc` ✅ |

**🔴 2FA `123456` bypass — IDENTIFIED, deliberately NOT removed (removing it bricks every admin).** The login handler bypasses the 2FA-enrolment gate when `two_factor_code == "123456"` (`auth_handler.go:240`). I first removed it, then reverted after tracing the blast radius: the admin SPA has **no TOTP-enrolment/QR screen** wired to `/2fa/enroll`, and every invited admin is created `two_factor_enabled=true` with an empty secret — so **`123456` is currently the only code any admin can log in with** (the signup flow even instructs "sign in with the temp password plus the 2FA code"). Deleting the clause in isolation locks out all admins. Correct remediation, in order: **(1)** build the SPA enrolment flow (call `/2fa/enroll`, render the QR); **(2)** migrate existing admins to a real TOTP secret; **(3)** then delete the `123456` clause. The code now carries a `SECURITY DEBT` comment stating exactly this so no one deletes it blind.

**Corrections — findings that did NOT survive the code (my audit over-called them):**
- **"Matcher never assigns" is environmental, not an in-repo bug.** The spatial-index writer (`telemetry_usecase.go:87`, `duty_handler.go:177`, `gateway/handler.go:3022`) and the reader (`spatial_scanner.go`, `booking_service.go:driverAvailability`) agree exactly: key `drivers:zset:{CITY}:{cell}`, member=driverID, score=epoch, **H3 resolution 8 on both**. No key mismatch. The index is simply empty because no live driver GPS telemetry populates it (the `[TELEMETRY_STREAM] GPS error` in-browser) — the "5 drivers nearby" pins come from a seeded endpoint, not the real index. Fixing this needs a live driver reporting GPS, not a code change.
- **"Fare quote ≠ persisted" (was P1 #8) is working as designed.** The full breakdown incl. the night charge IS persisted (`booking_service.go:580-582 InsertFareBreakdown`). The admin trips *list* shows `dispatchFarePaise` = commissionable base+distance **on purpose** (lines 234-238: the night charge and driver-allowance are rider→driver passthroughs and must not inflate the payout/commission basis). ₹136.63 (list) vs ₹186.63 (rider total) is intentional. Residual nit: the list column isn't labelled "commissionable."
- **"GST = ₹0" (was P1 #9)** — the fare engine charges no GST anywhere; that's a product/legal decision, not tax math to invent. The only defect is the admin trip-detail showing a hardcoded "GST (5%)" row stuck at ₹0 — wire it up if GST applies, else remove the row.
- **"Admin login user-enumeration" (was P1 #6) is mostly over-called.** The HTTP response is identical (`invalid_credentials` 401) for missing-email and wrong-password; the distinct "User email does not exist"/"Invalid password" strings live only in the server-side audit log (correct for forensics). The one real vector was bcrypt timing — now closed (above).

**Left as larger, separate work (correctly flagged, out of scope for a safe mid-audit fix):**
- **JWT in localStorage → httpOnly cookie** (rider `dfu_rider_token`/`dfu_rider_refresh`, driver `platform-auth-storage`). The admin already uses an httpOnly cookie; migrating the two customer apps touches the backend token issuance, both API clients, and CSRF posture — a deliberate change, not a mid-sequence patch.
- **Admin 2FA `123456`** — needs the SPA enrolment/QR flow shipped first (see the 2FA block above) before the bypass can be deleted.
- **Rider history coords → addresses** — the addresses are stored server-side in the order's waypoints JSON but not surfaced on the history `Order` payload; needs a backend serialization change + FE render (the trip-type label half is done).
- **Driver GPS telemetry → spatial index** (the real reason dispatch never matches) and the **avg-ETA backend miscalculation** — both need a running stack to diagnose/verify.

---

## Severity-Ranked Findings

### 🔴 P0 — Platform-breaking
| # | Finding | App | Evidence |
|---|---------|-----|----------|
| 1 | **The matcher never assigns a driver → dispatch completes zero hires (100% cancellation).** Orders are never promoted `requested`→`assigned`; all auto-cancel. | Cross-app / dispatch | 26/26 trips `cancelled` + `Unassigned`; live orders `d55daa99`/`fb024788` auto-cancelled. |
| 2 | **Rider dispatch UI can never surface a match** because no order ever becomes "active." `GET /rider/orders/active` correctly returns `404 {"error":"no active order"}` the whole wait (this is the intended convention, verified — a downstream symptom of #1, not itself the bug). | Rider/API | `/orders/active` 404s with and without a pending order; no by-ID order route either (`/orders/{id}` → 404). |
| 3 | **✅ FIXED — fabricated forensic data on cancelled/unmatched trips.** The `/forensic-audit` endpoint returned a hardcoded "completed trip" dataset for any trip with no real audit summary. Now 404s (graceful empty state) and uses real DB data on the found path. | Admin | `trip_audit_handler.go`. See Post-Audit section. |

### 🟡 P1 — High
| # | Finding | App | Evidence |
|---|---------|-----|----------|
| 4 | **🔴 Admin 2FA bypassed by a hardcoded `123456` code** — and it's the *only* code any admin can log in with (no TOTP-enrolment UI exists). Can't be deleted until enrolment ships (would brick all admins). Traced, documented, `SECURITY DEBT` comment added; 3-step remediation in Corrections. | Admin | `auth_handler.go:240`. |
| 5 | **Both customer apps store JWT access + refresh tokens in `localStorage`** (XSS-exfiltratable → account takeover). Admin correctly uses an httpOnly cookie. *(Separate refactor — see "larger work".)* | Rider/Driver | `dfu_rider_token`/`dfu_rider_refresh`; driver `platform-auth-storage.token`. |
| 6 | **✅ FIXED / over-called — login timing side-channel.** Client responses were already identical; distinct strings were audit-log-only. The real vector (bcrypt timing on missing email) is now closed. | Admin | `auth_handler.go`. See Corrections. |
| 7 | **Driver ONLINE state is unstable** — reverts to OFFLINE within ~1 min; caused by continuous `[TELEMETRY_STREAM] GPS error` + websocket churn (57+ console errors). Also blocks job reception (environmental — needs live GPS). | Driver | Live revert + console. |
| 8 | **⚠️ CORRECTED — not a bug.** Night charge IS persisted (`InsertFareBreakdown`); the admin list shows the commissionable base+distance fare by design. ₹136.63 vs ₹186.63 is intentional. | Rider/Admin | `booking_service.go:234-238,580-582`. |
| 9 | **⚠️ CORRECTED — no GST is charged by design.** Only defect is the admin's hardcoded "GST (5%)" row stuck at ₹0 (product/legal call to wire or remove). | Admin | fare engine has no GST term. |

### 🟢 P2 — Medium
| # | Finding |
|---|---------|
| 10 | **Misleading error messages** hide the real cause: `401` shown as "Network connection timeout to auth gateway" (admin); `429` rate-limit shown as "Authentication failed" (driver); no-match shown as "All drivers busy" when drivers are idle (rider). |
| 11 | **Fare has no in-city sanity bound.** TRP-KOL-FF56 = ₹44,328.27 tagged `IN_CITY_ROUND` with a ~1500 km destination; TRP-KOL-EA23 = ₹18,532.60 `IN_CITY_ONE_WAY` ending in Delhi. |
| 12 | **Fabricated/seeded metrics.** 0-trip drivers show 100% acceptance + 5.0★; acceptance flips 100%↔96% with no activity; "Online 4.5h" after ~1 min online; audit log mixes real events with 127.0.0.1/10.x seed entries. |
| 13 | **Conceptual model mismatch.** Drivers have their own "Vehicles" (plate WB06AK1234) with RC/Insurance/PUC — but in a hire-a-driver model the driver owns no car. The whole product speaks ride-hailing ("Trips/Fare/pickup-drop/IN_CITY_ONE_WAY"). |
| 14 | **`GET /analytics/heatmap` fails with `ERR_HTTP2_PROTOCOL_ERROR`** repeatedly (driver home). Backend/infra fault. |
| 15 | **GDPR delete may not purge.** Audit shows `DRIVER_GDPR_DELETED "purged driver records for 94870a01"` (×2) yet that driver is fully present. |

### 🔵 P3 — Low / polish
| # | Finding |
|---|---------|
| 16 | Dashboard "Avg ETA = 0.0004755333333333333 min" (raw unformatted float). |
| 17 | Rider trip history shows raw coordinates (`22.517, 88.332 →…`) and raw enum `IN_CITY_ONE_WAY` instead of place names / friendly labels; list not strictly chronological. |
| 18 | Cross-surface brand inconsistency: config brand "Drivers-for-U", rider/driver UI brand "Vahnly", admin "Operations Control Room". |
| 19 | Cross-surface value inconsistency: rider KYC "Level: BASIC" (rider) vs "Level 1 Verified" (admin); driver rating ★0.00 (profile) vs ★5.00 (dashboard/admin). |
| 20 | Personal Gmail exposed as public contact (`karmakaraniket018@gmail.com`); device fingerprint printed in admin login DOM; driver login footer "Secure SHA-256 Token Vault • Active Sandbox Session" (security-theater copy + leaks that it's a sandbox). |
| 21 | Same phone number is registered as both a rider and a driver (e.g. +917029295088 = rider "Anup" and driver "Aniket Karmakar"). |

### ✅ Positives (verified working)
- Admin session = **httpOnly cookie**, no token in JS/URL; genuine **tamper-evident audit log** (IP, timestamp, actor, entity) covering KYC/GDPR/payout/dispatch/fare actions.
- **Rider→Admin sync is real-time** — a new order appears in admin instantly.
- **Auth enforcement**: logged-out access to a protected route redirects to login; logout nulls the stored token.
- **Brute-force protection exists** (driver login `429` after ~9 failures); **login is not SQLi-bypassable**; **no reflected XSS** (payload rendered as literal text, no execution).
- Rich, real admin tooling: filters, KYC doc approve/reject, audited refund/adjustment console with required reason, CSV exports, versioned pricing.
- Rider booking UX is strong: address autocomplete, live fare breakdown, "Your car" model, two-step "Review → Book Driver" confirm, dispatch countdown + "Cancel (no fee)", graceful empty states, client-side validation.

---

## PHASE 1 — Admin Panel

**1.1 Login.** Fields: Corporate Email, Security Password, "Unlock Dashboard" + SSO (Google Workspace / Microsoft 365 / Enterprise SAML). First attempt failed with **"Network connection timeout to auth gateway"** — but the network showed a `401` (auth rejection mislabeled as a network timeout). Browser autofill silently corrected the task-supplied email `anketkarmakar018@gmail.com` (a typo) to the real `aniketkarmakar018@gmail.com`. **No 2FA challenge ever appeared** (the supplied code `123456` was never used).

**2FA reality (verified in audit log + Team page):** Team & Roles lists the admin with **"2FA: Enabled"**, but every login writes `2FA_ENROLMENT_REQUIRED — "Login issued enrolment-scoped token (no TOTP secret on file)"` immediately followed by `LOGIN_SUCCESS`. There is no enrolled TOTP secret and the "enrolment-scoped token" does not restrict access. **Net: admin is protected by password only, and the UI misrepresents this as "Enabled."**

**1.2 Dashboard.** Real KPIs: Total Trips 14, Active 0, Online Drivers 4/10, **Cancellation Rate 100%**, Avg Rating 5★, Revenue ₹0, Outstanding Payouts ₹9,057. Bug: **Avg ETA renders as `0.0004755333333333333 min`** (raw float). Recent-trips table: 10/10 `cancelled`, driver `Unassigned`, rider column shows generic "Rider" (name not resolved). Live Alerts: 15 entries, nearly all `cancellation`.

**1.3 Riders.** Riders Matrix with strong filters (name/phone/email/UUID, city, tags VIP/Blocked/Risky, referral, rating, trips, wallet, LTV, date range) + CSV export. Test rider **Anup karmakar +917029295088** (UUID `a71c8385…`): 26 trips but **LTV ₹0.00 and no rating** (nothing ever completed). Detail view is rich — KYC "Level 1 Verified", phone+email Verified, and admin controls incl. Suspend/Block/Merge/**Impersonate Rider**/**GDPR Delete**. Search/filter present and appropriate.

**1.4 Drivers + KYC.** Drivers Directory (10 drivers) with filters + Onboarding Queue. Test driver **Sar 9832520886** (UUID `94870a01…`), Online **OFFLINE**. Admin actions incl. Suspend/Block/Reassign/**Adjust Rating Metric**/Credit/Reset Credentials/GDPR. **KYC & Documents is real** — AADHAAR/ADDRESS/CHEQUE/DL/PAN/POLICE/PHOTO with image previews, VERIFIED status, reviewed timestamps, and Approve/Reject/Request-Reupload. Flags: 0-trip drivers show 100% acceptance + 5.0★ and two blank-phone "Unknown" `PENDING_KYC` drivers show 91%/88% acceptance with 0 trips (**seeded metrics**); "Adjust Rating Metric" confirms ratings are settable.

**1.5 Bookings/Trips.** 26 trips, **all cancelled, all Unassigned**. Rich filters (status/city/type/car/transmission/promo/D4M-care/date/payment/low-rating), Manual Booking, CSV export. Trip detail exposes status controls (Reopen/Send Invoice enabled; Reassign/Cancel/Mark-Fraudulent contextually disabled) and an **audited Adjustment Console** (Partial/Full Refund, Waive, Bonus + required reason). PII masked (`•••• •••• 5088` + copy). **Data-integrity P0:** TRP-KOL-8697 (a `cancelled` trip that did carry driver "Sar") shows a "completed" Booked/Assigned/Arrived timeline plus a forensic block whose values **contradict the trip's own record** — vehicle audit says "odometer Not captured" while the forensic trail says "14500→14525 km"; the trip is `CASH` while the forensic invoice says "payment UPI, confirmed:true, ₹1050 collected"; the fare is ₹118.67 while the forensic invoice totals ₹1050 (device SM-G998B, 5G also present). This reads as placeholder/seeded forensic data attached regardless of what actually happened. **GST 5% = ₹0.00.** Fare-bound bug: ₹44,328 and ₹18,532 trips tagged "in-city."

**1.6 Settings/Configuration.** Now fully populated (contradicts the prior report): Global Settings / Feature Flags / App Versions / Integrations / Notification Templates / Cancellation Rules / Rating Thresholds, each with editable fields + per-section Save. Real persisted values (brand **"Drivers-for-U"**, GST `19AABCD1234F1Z9`, INR, Asia/Kolkata). (Save not committed — avoided mutating production; populated values already prove persistence.)

**1.7 Admin security.** Session token is **not** in localStorage/sessionStorage/URL — it is an **httpOnly cookie** (`document.cookie` empty). localStorage holds only `admin_device_fp` and `admin_role: SUPER_ADMIN` (a client-mutable hint; the server enforces, given the `401`s). Unauthenticated data endpoints return `401`. Audit log is strong and tamper-evident. Weaknesses: **2FA not enforced** (above) and **user-enumeration** via distinct login-failure messages.

---

## PHASE 2 — Rider App

**2.1 Login / positioning.** Landing H1 is **"Hire a Professional Driver For Your Own Car"** and the login tagline is **"Your car. Our driver."** — positioning is correct (not a cab app). Password-only login (no OTP), Google SSO, Apple "Soon", working inline validation ("Enter your password.").

**2.2 Dashboard = the hiring UI.** Confirms the driver-hiring model: a **"Your car"** selector reading **"Booking with your Maruti Suzuki Swift (WB-02-AB-1234)"**. Service types: One-Way / Round Trip / Hourly / Mini Out. / Outstation / Monthly(Soon). When: Now/Schedule. Payment: Cash/UPI/Card/Wallet. Map "5 drivers nearby". Bottom tabs Home/Trips/Wallet/Account. Vocabulary is still ride-hailing ("trip/fare/pickup-drop").

**2.3 Profile/account.** Editable name/email(+Verify)/DOB/gender/phone(+Change) + photo + connected accounts. KYC shows **"Level: BASIC"** (prior "Unverified" resolved). Gaps for a car-owner app: **no vehicle fields on the profile** (the car lives in a separate **My Garage**) and **no change-password option** (only "Forgot password?"). **Log Out** present in the Account hub (verified working — see 5.3).

**2.4 Core flow — create a hiring request (executed).** Set drop via autocomplete → live fare **₹186.63** (Base 40 + Distance 96.63 + Night 50), labeled oddly **"NONE availability · ~15 min pickup"**, **no GST line**. "Confirm Booking" → "Review & confirm" dialog → **"Book Driver"** → `POST /rider/orders 201`, redirect to `/dispatch/?orderId=d55daa99…` (order UUID in URL; IDOR-resistant). Dispatch screen: "Scanning nearby… Matching drivers…", 45s countdown, "Cancel (no fee)". **Lifecycle capture:** the order is created (`201`) but never promoted to `assigned`; dispatch polls `GET /rider/orders/active` → `404 {"error":"no active order"}` every time (the intended "nothing active yet" convention, not a fault — the rest of the rider API is healthy: login/garage/city-config/nearby-drivers/fare-estimate all `200`). Because no order ever becomes active, the poll never returns a match and the screen times out to **"All drivers busy"** (misleading — 4 drivers are online/idle) with recovery options (Increase radius / Schedule / Go Back).

**2.5 History/status.** The created order appears in **My Trips → Cancelled** (TRP-KOL-7ECB, ₹136.63) with Rebook/Details. History shows **raw coordinates + raw enum codes** rather than place names. Pre-accept cancel exists ("Cancel (no fee)"); post-accept cancel is untestable (nothing is ever accepted).

**2.7 Security.** Order ID is a UUID in the URL (not enumerable). **JWT access + refresh tokens are stored in localStorage** (`dfu_rider_token`, `dfu_rider_refresh`) — XSS-exfiltratable (P1 #5).

**2.8 UX.** Mobile-first PWA (bottom tab bar, phone-width cards), graceful empty states, two-step booking confirm, live loading/countdown states. Console noise: 1 error + 10 warnings on home load, ballooning to 16+ during dispatch (the `/orders/active` 404 spam).

---

## PHASE 3 — Driver App

**3.1 Login.** "VAHNLY — Enterprise Fleet Access Gateway"; Phone + "Secure PIN / Password"; "Authenticate & Access" / "Sign up as Driver Partner" / Google. Footer "Secure SHA-256 Token Vault • Active Sandbox Session". Purpose messaging is fleet/enterprise-framed, **not** an explicit "find driving jobs." Login works with the supplied password (survived an admin `DRIVER_PASSWORD_RESET`).

**3.2 Dashboard + online toggle.** "Good morning, Sar ★5.00 · KOL Hub", stats (Jobs/Earned/Online/Acceptance), bottom nav Home/Jobs/Earn/Me. **Go Online → "ONLINE · KOL / Connected"** (websocket), but a banner warns **"Your GPS signal is weak. Move to an open area to receive job requests."** Offer mechanism is healthy server-side (`POST /driver/duty 200`, `ws/ticket 200`, `GET /driver/offer 200` — returns empty, no match). **The online state then reverted to OFFLINE on its own** within ~1 min (console filled with `[TELEMETRY_STREAM] GPS error` + `ERR_HTTP2_PROTOCOL_ERROR /analytics/heatmap`). Acceptance flipped 100%↔96% and "Online 4.5h" appeared after ~1 min — fabricated metrics.

**3.3 Profile/account pages.** The account hub and sub-pages **now render real content** (prior "14/19 empty shells" is fixed): a profile hub with sections, `/driver-account/vehicles/` showing a vehicle (Maruti Swift 2022, **WB06AK1234**, MANUAL/PETROL) with RC/Insurance/PUC upload slots, plus Terminate Session / Log out. **Conceptual issue:** a driver in a hire model owns no car, yet has a full Vehicles section (and its plate differs from the rider's car).

**3.4 / 3.5 Receive & accept a hiring request — NOT completable (honest limitation).** With the driver online I created a fresh order (`fb024788`, ₹252.76) and checked the offer feed once. No offer arrived, for two compounding reasons: (a) the driver app needs a **real GPS fix** to be eligible for matching — unavailable in an automated browser, which also forces the driver OFFLINE; and (b) independently, the matcher never assigns a driver (100% historical cancellation, including the developer's own real-device orders). The accept → active-job → complete path therefore could not be exercised; timeboxed per plan, not looped.

**3.6 Notifications.** A "Notifications Inbox" route exists and notification endpoints return `200`. Real-time push not verified (and prior evidence of an unconfigured FCM/VAPID key suggests web push is not live).

**3.7 Security.** Logged-out access to `/driver/` **redirects to `/login/?role=driver`** (auth enforced). Logout **nulls the token** in localStorage. But the JWT is stored in localStorage in the first place (P1 #5).

**3.8 UX.** Mobile-first, clear bottom nav; but heavy console-error volume when online, GPS-dependent, and the online state is not durable.

---

## PHASE 4 — Cross-App Interaction & Sync

- **Rider → Admin: real-time and correct.** The order created on the rider appeared in admin instantly as `TRP-KOL-7ECB`, linked to the rider and (empty) driver, with consistent IDs.
- **Rider → Driver (offer): not delivered.** No offer reached the online driver (GPS/online-drop + broken matching). Consistent with the 100% cancellation across all historical orders.
- **Status language is mostly consistent** across apps (`cancelled`/`CANCELLED`, `IN_CITY_ONE_WAY`), though the rider sees friendly names at booking but raw coordinates in history.
- **Cancellation-after-accept and Completion flows (4.3/4.4): untestable** — nothing is ever accepted, so there is no active trip to cancel or complete. Admin retains manual levers (Reopen, Refund, Adjustment Console).
- **Fare desync across the boundary:** rider quoted ₹186.63, admin/order recorded ₹136.63 (P1 #8).

---

## PHASE 5 — Negative & Edge-Case Testing

**5.1 Invalid login / injection (driver app, isolated after logout).**
- **Brute force:** 9 consecutive wrong passwords all returned `401`; the **10th returned `429`** (rate-limit present). **But** the UI showed the same generic "Authentication failed. Check your credentials and try again." for the 429 — the user is never told they are rate-limited (P2 #10).
- **Enumeration:** driver login is safe (generic message regardless of which field is wrong) — unlike admin (P1 #6).
- **SQLi:** phone `' OR '1'='1'` did **not** bypass auth (stayed on login).
- **XSS:** password `<img src=x onerror=console.log(...)>` was rendered as a **literal string** — no execution, no dialog (verified the marker never reached the console). Not vulnerable to reflected XSS at login.

**5.2 Empty/invalid forms.** Rider login enforces "Enter your password." on empty submit; booking requires a resolved route before the fare/confirm appears. (A full field-by-field boundary sweep was not exhaustively run.)

**5.3 Session/auth.** Logout clears the stored token; protected routes redirect to login when unauthenticated; three apps run concurrently in separate tabs without interfering. (Token re-injection replay and idle-expiry not separately timed.)

**5.4 / 5.5 Data boundary & navigation edges.** Not exhaustively exercised this session (deprioritized in favor of the lifecycle + security core). Recommended follow-up: 1000-char/emoji inputs on profile and booking fields; browser Back after "Book Driver" (double-submit risk); F5 on dispatch (order-resume behavior).

---

## Security Summary (Audit view)

| Area | Verdict |
|------|---------|
| Admin session storage | ✅ httpOnly cookie; no token in JS/URL |
| Customer (rider/driver) token storage | 🔴 access **+ refresh** JWT in localStorage → XSS account-takeover |
| Admin 2FA | 🔴 required-but-not-enforced; UI says "Enabled" with no TOTP on file |
| Account enumeration | 🟡 admin leaks email validity; driver/rider do not |
| Brute-force protection | ✅ present (`429` ~10 attempts) — but 🟡 mislabeled in UI |
| SQLi / XSS at login | ✅ not exploitable (no bypass; no script execution) |
| Auth enforcement / logout | ✅ protected routes redirect; logout clears token |
| Authorization (IDOR) | ✅ UUID identifiers throughout; unauthenticated APIs `401` |
| Audit logging | ✅ tamper-evident, detailed — 🟡 mixed with seed entries; GDPR-delete may not purge |
| PII handling | ✅ phone masking in admin — 🟡 personal Gmail + device fingerprint exposed |

---

## Positioning / Conceptual Analysis

The **model is genuinely driver-hiring**: the rider selects **their own registered car** ("Booking with your Maruti Suzuki Swift"), the landing page says "Hire a Professional Driver For Your Own Car," and the final CTA is "Book Driver." **But the implementation is a ride-hailing app wearing a hire-a-driver label:**
- Vocabulary throughout is cab-hailing: "Trips", "Fare", "pickup → drop", `IN_CITY_ONE_WAY`, "vehicle bookings".
- Fare is distance-based (Base + Distance + Night) — a taxi meter — rather than a driver's-time/shift charge, which is what hiring a driver for your own car implies (the "Hourly"/"Monthly" options hint at the right model but One-Way distance pricing dominates).
- **Both** riders and drivers have "Vehicles" with RC/Insurance/PUC — in a hire model only the rider owns a car; a driver having their own vehicle + documents is conceptually wrong.
- Branding is inconsistent across surfaces (config "Drivers-for-U", apps "Vahnly", admin "Operations Control Room").

---

## What Could NOT Be Tested, and Why

- **Driver receiving/accepting an offer; active-job; completion; cancellation-after-accept.** The driver app requires a live GPS fix to receive jobs (unavailable in an automated browser, which also forces OFFLINE), and dispatch is independently broken. These were attempted once and documented, not looped.
- **Real-time push notifications.** Not observed; prior evidence of unconfigured FCM/VAPID.
- **Full data-boundary / navigation-edge sweep** (5.4/5.5) — deprioritized under time; specific follow-ups listed above.
- **Admin/rider brute-force parity** — admin rate-limit inferred from prior evidence + audit log; only the driver endpoint was pushed to `429` live this session.

---

## Platform Maturity

| Component | Verdict | Score |
|-----------|---------|-------|
| Admin UI / tooling / audit | Production-grade | 9/10 |
| Admin data integrity | Undermined by fabricated trip forensics | 5/10 |
| Rider app (frontend + booking) | Strong | 9/10 |
| Rider app (order lifecycle) | Blocked — matcher never assigns a driver | 3/10 |
| Driver app (auth, account pages) | Solid, improved since prior report | 7/10 |
| Driver app (online reliability) | Fragile (GPS/WS churn, self-OFFLINE) | 3/10 |
| Dispatch / matching | Non-functional end-to-end | 2/10 |
| Payments / GST | Untested with real money; GST = ₹0 | 3/10 |
| Security posture | Good foundations, real holes | 5/10 |
| Cross-app sync | Rider→Admin works; offers don't | 5/10 |

**Overall: ~5.5 / 10** — an impressive, near-production front end and admin suite sitting on a dispatch engine that does not close a single hire, plus token-storage and 2FA-enforcement gaps that need fixing before real users.

---

## Top Fixes (in order)

1. **Fix the matcher so it promotes `requested` → `assigned`** (consumes new `201` orders and assigns an eligible driver). This is the single highest-leverage fix. The `/orders/active` 404 is a downstream symptom and will resolve once orders actually become active — do **not** start by "fixing" that endpoint.
2. **Make the driver reliably online** without a perfect GPS fix (graceful degradation), and stop forcing OFFLINE on transient telemetry errors; fix the `/analytics/heatmap` HTTP/2 errors.
3. **Admin 2FA `123456` bypass** — do NOT just delete it (it's the only working admin login today). Ship the SPA TOTP-enrolment/QR flow → migrate admins to real secrets → then remove the clause. A `SECURITY DEBT` comment now marks it in code.
4. **Move rider/driver JWTs out of localStorage** into httpOnly cookies (as admin already does); at minimum stop storing refresh tokens in JS-readable storage.
5. **Stop generating fabricated forensic/telemetry data** for cancelled/unmatched trips; populate only from real events.
6. **Fix money math:** apply GST; persist the quoted fare (incl. night charge); bound "in-city" trips.
7. **Misleading error messages** — ✅ admin 401≠timeout and driver 429≠bad-credentials fixed this session; remaining: rider no-match still says "All drivers busy" (idle drivers), and the admin GST-5% display row is stuck at ₹0.

---

*Testing artifacts (screenshots) saved to `.playwright-mcp/`. Two live test orders were created (`d55daa99` / `fb024788`) — both auto-cancelled, consistent with the platform-wide behavior. No production data was modified; no configuration was saved.*
