# Driver App — Open Issues (2026-07-08)

> **Update (2026-07-08, second machine):** #2 and #5 fixed in code (see below).
> #3, #4, #6 turned out to be per-machine `.env` drift — on this machine the
> keys are real / the dead vars are already gone. #1 got new evidence: the DNS
> record exists and points at Firebase Hosting.

Working notes from a login-debugging session. Two real bugs got fixed and
shipped; this file tracks what's still open so it can be picked up on
another machine.

## Fixed today (context, already live)

1. **Google Sign-In `auth/configuration-not-found`** — `client-app/.env.local`
   pointed Firebase Auth at project `drivers-for-u`, which does not exist in
   this account. Repointed at the correct, already-registered "Vahnly Driver"
   web app under `vahnly-platform` (same project rider-app/admin use).
   **This fix is env-only and `.env.local` is gitignored — it is NOT in this
   repo.** Reproduce on another machine with:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCi9FH_Xh9wgBEoH4ACCGGnVQM6f9qBHmY
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=vahnly-platform
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1016868477506
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1016868477506:web:515c9eee14f5c86343abdb
   ```
   Verified live: Google Sign-In now opens a real OAuth popup at
   `vahnly-platform.firebaseapp.com/__/auth/handler` instead of failing
   instantly.

2. **Password login bounced back to `/login?role=driver`** — `AuthGuard.tsx`
   read `isAuthenticated`/`user` from the Zustand `persist`-backed auth store
   and redirected the instant either was falsy, including the brief window
   before `persist` finishes reading the session back from localStorage on a
   fresh page load. Fixed with a `hasHydrated` flag gate
   (`client-app/src/store/useAuthStore.ts`, `client-app/src/components/AuthGuard.tsx`).
   Committed: `206dab27`. Verified live with a real driver account — lands on
   `/driver` and stays, renders live dashboard state.

## Still open — needs real investigation

### 1. Unexplained domain jump: `vahnly-driver.web.app` → `driver.aniket.site`
Mid-session, navigating to `/driver/` on `vahnly-driver.web.app` and then just
waiting (no click, no code) landed on `https://driver.aniket.site/login/` —
a **different origin**, so its localStorage is empty and any valid session on
`vahnly-driver.web.app` is invisible there.

Ruled out so far:
- No `Location` header / HTTP redirect (`curl -I` on both routes returns
  plain `200 OK`).
- No `driver.aniket.site` string anywhere in `client-app/src` or in the
  served HTML.
- No service worker registered (`navigator.serviceWorker.getRegistrations()`
  returned `[]`).
- `driver.aniket.site` is **not** a registered custom domain on any Firebase
  Hosting site in this project (`firebase hosting:sites:list` — only
  `vahnly-driver.web.app`, `vahnly-platform.web.app`, `vahnly-rider.web.app`
  exist).
- `performance.getEntriesByType('navigation')` showed `redirectCount: 0,
  type: "navigate", referrer: ""` — looks like a fresh top-level nav, not a
  same-page JS redirect the Performance API would normally attribute.

**New evidence (2026-07-08, second machine):**
- `nslookup driver.aniket.site` resolves: it is a **CNAME to
  `vahnly-driver.web.app`** (Firebase Hosting IP `199.36.158.100`). Not
  dangling, and NOT the Caddy VM — the record deliberately points this domain
  at the driver app's Firebase site.
- The earlier "not a registered custom domain" ruling is unreliable:
  `firebase hosting:sites:list` lists **sites**, not custom domains attached
  to a site. Check Firebase Console → Hosting → `vahnly-driver` → custom
  domains instead.
- `client-app/.env.local` on this machine sets
  `NEXT_PUBLIC_APP_URL=https://driver.aniket.site` — unused by any code
  (grep confirms), but shows the domain is intentional, someone set it up as
  the app's canonical URL.

- Fetching `https://driver.aniket.site/` and `/login/` returns the real
  Vahnly driver app (title "Vahnly | Unified Dispatch Platform", full login
  form). Firebase serves "Site Not Found" for unregistered hosts, so this
  **confirms** the domain is a registered custom domain on the
  `vahnly-driver` Hosting site.

So the domain itself is explained (deliberate custom-domain setup). Still
unexplained: what made the **browser navigate** there mid-session with
`redirectCount: 0`. Needs the clean retest below; if custom-domain
registration on the Firebase site is confirmed, most likely culprit is
browser autocomplete/HSTS history rather than app code.

Needs a clean retest from a normal browser on a normal network.

### 2. ~~`/api/v1/city-config` 404s on every driver-app page load~~ ✅ FIXED
**Fixed 2026-07-08 by deleting the fetch.** Investigation confirmed the call
could never return anything useful:
- The only backend route is `GET /api/v1/rider/city-config`
  (`cmd/gateway/main.go:816`), behind **rider** auth middleware — the driver
  app's unauthenticated call would 401 even with the right path.
- The handler echoes the `?city` query param (default `KOL`) back as
  `city_prefix`. The driver app sent no param and only wanted a region
  prefix — the server could only ever tell it "KOL", which is already the
  client's own fallback.

Removed `loadRegionFromCityConfig`/`setRegion` from
`client-app/src/api/client.ts` (region now comes from
`NEXT_PUBLIC_REGION_PREFIX` env with the same KOL fallback) and the startup
call in `client-app/src/lib/providers/ThemeProvider.tsx`. Zero behavior
change, minus one guaranteed-404 request per page load.

### 3. Google Maps API key placeholder — mostly moot
- **Driver app: moot.** `client-app` never reads a Maps API key — the in-app
  map is MapLibre GL (`src/components/map/DriverMap.tsx`) and navigation uses
  Google Maps deep links (`src/lib/map/navigation.ts`), neither needs a key.
  On this machine `.env.local` has no Maps key line at all.
- **Admin panel:** `frontend/.env` on this machine has a real-looking
  `VITE_GOOGLE_MAPS_API_KEY` (used by `ControlRoomDashboard.tsx:131`). The
  placeholder was machine-local drift. If maps break on another machine,
  copy the key from a working `.env`.

### 4. FCM VAPID key placeholder — machine-local drift
On this machine `client-app/.env.local` already carries a real VAPID key
(`BNCI02Ji…`, same one as rider-app). The placeholder existed only on the
debugging machine's `.env.local` — copy the real key there (or pull it from
Firebase Console → Project Settings → Cloud Messaging → Web Push
Certificates, project `vahnly-platform`). Note `frontend/.env` still has
`VITE_FCM_VAPID_KEY=your_vapid_key` if admin web push ever matters.

### 5. ~~"Apple Sign-In" on driver login is fake~~ ✅ FIXED
**Fixed 2026-07-08: button removed** (the "remove until it's real" option).
The federated sign-in row in `src/app/login/page.tsx` is now a single
full-width Google Sign-In button. Re-add Apple only with real Sign in with
Apple wiring.

### 6. Dead legacy env vars in `client-app/.env.local` — machine-local
On this machine `.env.local` has no Vite-style vars — only `NEXT_PUBLIC_*`.
The leftovers existed only on the debugging machine's local file; delete
them there (nothing in `client-app` reads `VITE_*`).

## Not investigated at all yet
- Whether the domain-jump issue (#1) also affects `vahnly-rider.web.app` or
  `vahnly-platform.web.app` — only tested on the driver app.
- Whether admin panel has its own placeholder-key or fake-button issues like
  #3–#5 above (frontend's Maps key is confirmed placeholder; didn't check
  further since admin login itself was reported working).
