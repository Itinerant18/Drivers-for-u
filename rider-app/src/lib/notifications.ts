import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./firebase";
import { accountApi } from "./api/account";

// Register this browser for FCM web push and hand the token to the backend, which
// stores it in rider_device_tokens; the outbox notification engine then delivers
// trip/notification pushes to it. Safe to call on every authenticated mount — it
// no-ops when push is unsupported, the VAPID key is unset, or permission is denied,
// and getToken() is idempotent (returns the same token for an already-granted origin).
//
// Foreground messages are intentionally not handled here: while the app is open the
// WebSocket stream (RiderStreamManager) is the authoritative live-trip channel. This
// wiring exists only so the rider gets notified when the tab is backgrounded/closed.
export async function registerRiderPushNotifications(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  if (!vapidKey || !(await isSupported())) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const token = await getToken(getMessaging(app), { vapidKey });
  if (token) {
    await accountApi.registerDeviceToken(token, "WEB");
  }
}
