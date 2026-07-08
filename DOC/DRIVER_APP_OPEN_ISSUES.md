# Driver App — Open Issues (2026-07-08)

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

Best guess: DNS/network-level oddity specific to that test environment
(corporate DNS, VPN, or a stale OS-level HSTS/redirect entry for
`*.aniket.site` domains), not app code — but **not confirmed**. Needs a
clean retest from a normal browser on a normal network. If it reproduces for
real users, check:
- DNS records for `driver.aniket.site` (does it even resolve to something
  real, or is it dangling?)
- Whether the VM's Caddy config (same box that serves `api.aniket.site`) has
  a `driver.aniket.site` block redirecting or serving something stale.

### 2. `/api/v1/city-config` 404s on every driver-app page load
`client-app/src/api/client.ts:51` calls `GET /api/v1/city-config` (no role
prefix). Backend only has a rider-scoped route
(`internal/rider/service/trip_spec.go` references it as served "via
city-config" under the rider API tree — actual registered path is almost
certainly `/api/v1/rider/city-config`, matching the pattern used everywhere
else, e.g. `driver/login`, `rider/auth/login`). The driver app is hitting a
path that was never registered for it, so it 404s on every single page load.
Not currently blocking login, but:
- Confirm what city-config data the driver app actually needs (open
  hours? service area? something else?).
- Either add a `/api/v1/driver/city-config` backend route, or fix the
  frontend call to hit whatever the correct existing path is.

### 3. Google Maps API key is a placeholder — driver app AND admin panel
```
client-app/.env.local:  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
frontend/.env:          VITE_GOOGLE_MAPS_API_KEY=your_key_here
```
Any map view in either app is broken (rider-app's key is real and working —
copy whatever pattern it uses, or provision fresh keys scoped to each site's
domain).

### 4. FCM push notifications are a placeholder — driver app
```
client-app/.env.local:  NEXT_PUBLIC_FCM_VAPID_KEY=your_vapid_public_key_here
```
`registerDriverPushNotifications()` is called after every successful login
(`src/app/login/page.tsx`) but will silently no-op or fail with this
placeholder. Needs a real VAPID key from Firebase Console → Project Settings
→ Cloud Messaging → Web Push Certificates (project `vahnly-platform`).

### 5. "Apple Sign-In" on driver login is fake
`src/app/login/page.tsx:852-855` — the button's entire handler is:
```ts
onClick={() => {
  addAuditLog('OAUTH_APPLE_CLICKED', { timestamp: new Date().toISOString() });
  alert('Apple Single Sign-On simulation complete.');
}}
```
No real Apple auth, just an audit log entry and a browser `alert()`. Same
"looks interactive, does nothing" pattern already cleaned up on the rider
app's profile page — either wire up real Sign in with Apple, or remove the
button until it's real.

### 6. Dead legacy env vars in `client-app/.env.local`
Lines 1–10 (`VITE_API_BASE_URL`, `VITE_FIREBASE_API_KEY`, etc.) are Vite-style
vars left over from before this app was migrated to Next.js — `client-app` is
Next.js (`import.meta.env` doesn't exist in this build), so none of these are
ever read. Harmless but confusing; safe to delete once someone confirms
nothing external still depends on them.

## Not investigated at all yet
- Whether the domain-jump issue (#1) also affects `vahnly-rider.web.app` or
  `vahnly-platform.web.app` — only tested on the driver app.
- Whether admin panel has its own placeholder-key or fake-button issues like
  #3–#5 above (frontend's Maps key is confirmed placeholder; didn't check
  further since admin login itself was reported working).
