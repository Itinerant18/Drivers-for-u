import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { getPendingOffer, registerDeviceToken } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useDriverDutyStore } from '@/store/useDriverDutyStore';
import { useOfferStore } from '@/store/useOfferStore';

function readConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !messagingSenderId || !appId) {
    return null;
  }

  return { apiKey, projectId, messagingSenderId, appId };
}

export async function registerDriverPushNotifications(authToken: string): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  const firebaseConfig = readConfig();
  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  if (!firebaseConfig || !vapidKey || !(await isSupported())) {
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return;
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const fcmToken = await getToken(messaging, { vapidKey });

  if (fcmToken) {
    await registerDeviceToken(authToken, fcmToken, 'ANDROID_FCM');
  }
}

// Foreground pushes previously had no onMessage handler at all, so an FCM offer push
// could never surface the offer popup. The push payload is wake-only — on any message
// re-fetch the authoritative pending offer over REST and surface it exactly like the
// WebSocket path does. Attach once per session.
let foregroundHandlerAttached = false;

export async function attachForegroundPushHandler(): Promise<void> {
  if (foregroundHandlerAttached || typeof window === 'undefined') return;

  const firebaseConfig = readConfig();
  if (!firebaseConfig || !(await isSupported())) return;

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  onMessage(getMessaging(app), () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    void getPendingOffer(token)
      .then((res) => {
        if (
          res.order &&
          (res.offer_expires_in_seconds ?? 0) > 0 &&
          useDriverDutyStore.getState().dutyState === 'ONLINE'
        ) {
          useOfferStore.getState().setOffer(res.order, res.offer_expires_in_seconds);
          useDriverDutyStore.getState().setDutyState('OFFER_PENDING');
        }
      })
      .catch(() => { /* WS + 10s poll are the other delivery paths */ });
  });
  foregroundHandlerAttached = true;
}
