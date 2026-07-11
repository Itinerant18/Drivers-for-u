# FCM Push Notifications — Setup Runbook

Finishing FCM web push for the **driver app**. Push needs **both** sides configured:

- **Receive** (client / `client-app`): service worker + Firebase SDK config + VAPID key.
- **Send** (backend / `notification` service): a Firebase service-account JSON.

Neither the VAPID key nor the service-account JSON is retrievable via CLI/MCP — both come from the Firebase console / gcloud. This runbook covers the remaining manual steps.

> Scope note: push is **driver-only**. The rider and admin apps use WebSocket, not FCM.

---

## Current state

**Done (in code / already run):**

- ✅ Service worker `client-app/public/firebase-messaging-sw.js` created + committed (`81593805`). Without it `getToken()` fails silently.
- ✅ Firebase SDK config already wired in `client-app/.env.local` (apiKey / projectId / messagingSenderId / appId).
- ✅ `registerDriverPushNotifications()` is called after driver login (`client-app/src/app/login/page.tsx:329`).
- ✅ Service-account key minted for `firebase-adminsdk-fbsvc@vahnly-platform.iam.gserviceaccount.com` and **scp'd to the VM home dir** (`~/fcm-service-account.json`).

**Pending:**

- ⏳ SEND: place the key on the VM, set `FCM_SERVICE_ACCOUNT_FILE`, restart the `notification` container.
- ⏳ RECEIVE: paste the VAPID key value, rebuild + redeploy the driver app.

---

## Reference values

| Thing | Value |
|-------|-------|
| Firebase project | `vahnly-platform` |
| Admin SA | `firebase-adminsdk-fbsvc@vahnly-platform.iam.gserviceaccount.com` |
| Minted key ID | `3e673bb0fa72cb52bc88f426267d89aad44bad87` |
| Local key (temp) | `C:/Users/itine/AppData/Local/Temp/claude/C--workspace-Driver/58a75686-4e6f-4821-bbb6-b20c5cca0ffe/scratchpad/fcm-service-account.json` |
| VM | `dfu-stack`, zone `asia-south1-c`, project `vahnly-platform` |
| Container cred path | `/secrets/fcm/fcm-service-account.json` (compose mounts host `./firebase` → `/secrets/fcm:ro`) |
| Driver Firebase site | `vahnly-driver` → <https://vahnly-driver.web.app> |

---

## PART A — SEND side (backend on the VM)

### A1. (done) Copy the key to the VM

```powershell
gcloud compute scp "C:/Users/itine/AppData/Local/Temp/claude/C--workspace-Driver/58a75686-4e6f-4821-bbb6-b20c5cca0ffe/scratchpad/fcm-service-account.json" dfu-stack:fcm-service-account.json --zone=asia-south1-c --project=vahnly-platform
```

> Windows/PuTTY notes: run as **one line** (PowerShell has no `\` continuation); use a **bare** remote filename (pscp doesn't expand `~`).

### A2. SSH into the VM

```powershell
gcloud compute ssh dfu-stack --zone=asia-south1-c --project=vahnly-platform
```

### A3. On the VM — place key, set env, restart, verify

```bash
# find the stack dir (the one holding docker-compose.yml)
DIR=$(find /opt /srv /home ~ -maxdepth 4 -name 'docker-compose*.y*ml' 2>/dev/null | head -1 | xargs -r dirname)
[ -z "$DIR" ] && DIR=$(sudo find /opt /srv /home /root ~ -maxdepth 4 -name 'docker-compose*.y*ml' 2>/dev/null | head -1 | xargs -r dirname)
echo "stack dir: $DIR"

# place the credential (compose mounts ./firebase -> /secrets/fcm:ro)
mkdir -p "$DIR/firebase"
mv ~/fcm-service-account.json "$DIR/firebase/fcm-service-account.json"
chmod 600 "$DIR/firebase/fcm-service-account.json"

# point the env at the container path
cd "$DIR"
grep -q '^FCM_SERVICE_ACCOUNT_FILE=' .env \
  && sed -i 's#^FCM_SERVICE_ACCOUNT_FILE=.*#FCM_SERVICE_ACCOUNT_FILE=/secrets/fcm/fcm-service-account.json#' .env \
  || echo 'FCM_SERVICE_ACCOUNT_FILE=/secrets/fcm/fcm-service-account.json' >> .env

# restart the sender
docker compose up -d --force-recreate notification

# verify
docker compose logs --tail=50 notification | grep FCM
```

**Success:** the log prints

```
[NOTIFICATION] FCM HTTP v1 sender active
```

If it still says `FCM_SERVICE_ACCOUNT_FILE unset — pushes will be logged, not delivered`, the env didn't apply — check `grep FCM_SERVICE_ACCOUNT "$DIR/.env"`.

**Fallbacks:**

- "permission denied" (stack owned by another user, e.g. `itine`) → prefix `mv`/`sed`/`docker` with `sudo`.
- `docker compose` not found → use `docker-compose` (hyphen).

---

## PART B — RECEIVE side (driver app / Firebase Hosting)

### B1. Get the VAPID Web Push key

Firebase console → project **vahnly-platform** → **Project Settings → Cloud Messaging → Web Push certificates** → **Key pair** (Generate if none) → copy the key string (starts with `B…`).

### B2. Set it in the driver app env

Edit `client-app/.env.local` line 34:

```
NEXT_PUBLIC_FCM_VAPID_KEY=<paste the key>
```

(The other `NEXT_PUBLIC_FIREBASE_*` values are already set correctly.)

### B3. Rebuild + redeploy the driver app

```bash
cd client-app
npm run build
firebase deploy --only hosting --project vahnly-platform
```

> `.env.local` bakes into the static build (`output: "export"`), so the key must be set **before** `npm run build`.

---

## PART C — End-to-end test

> **Caveat — dispatch blocker:** A real offer push only fires when the dispatch matcher assigns a driver.
> Matching requires an active driver entry in the `drivers:zset` (Redis geo-index), which is populated
> by GPS telemetry. Until the GPS-telemetry issue is resolved, no offer will be matched and no offer
> push will arrive — **even though FCM plumbing is fully correct**.
>
> **To test FCM in isolation** (without needing a real trip), use the Firebase Console direct test:
> Firebase Console → **Cloud Messaging → "Send test message"** → paste the driver's FCM device token
> → send. This bypasses dispatch entirely and confirms the full push delivery chain (VAPID → service
> worker → foreground/background handler) is working.

### Full offer push (once dispatch is unblocked)

1. Open <https://driver.aniket.site/login/> on a **real device / HTTPS** (web push needs HTTPS + a real GPS-capable device to also receive offers).
2. Log in as the driver → **Allow** the notification permission prompt.
3. Confirm a device token registered: driver profile / backend `driver_device_tokens` should have a row; notification service logs `FCM HTTP v1 sender active`.
4. Trigger an offer (rider books while this driver is online) → the driver should get a push even with the app backgrounded.

---

## Security notes

- The service-account JSON and the VAPID key are **credentials**. Never commit the JSON — the repo already gitignores `firebase/fcm-service-account.json`. Keep it `chmod 600` on the VM.
- Delete the **local temp copy** after A1 succeeds (it's in the session scratchpad and is a live key).
- If you do **not** end up using this minted key, delete it so it isn't an orphaned live credential:

  ```bash
  gcloud iam service-accounts keys delete 3e673bb0fa72cb52bc88f426267d89aad44bad87 \
    --iam-account=firebase-adminsdk-fbsvc@vahnly-platform.iam.gserviceaccount.com
  ```

- Rotate the key periodically; downloaded SA keys are long-lived.
