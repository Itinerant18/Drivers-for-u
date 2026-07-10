/* firebase-messaging-sw.js — FCM background-message handler for the Vahnly driver app.
 *
 * Required for web push: getToken() (in src/services/notifications.ts) auto-registers this
 * file at the origin root, and without it getToken() throws "failed to register a
 * ServiceWorker" and no FCM token is ever issued. A service worker cannot read
 * process.env / NEXT_PUBLIC_* (it is served as a static file, not bundled), so the Firebase
 * web config is inlined below. These are public client identifiers (not secrets — Firebase
 * security is enforced by rules, not by hiding the apiKey), and match the values the app
 * reads from .env.local. Keep them in sync if the Firebase app is ever re-registered.
 *
 * Note: the VAPID key is NOT needed here — it is only used app-side by getToken({ vapidKey }).
 */
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCi9FH_Xh9wgBEoH4ACCGGnVQM6f9qBHmY',
  authDomain: 'vahnly-platform.firebaseapp.com',
  projectId: 'vahnly-platform',
  storageBucket: 'vahnly-platform.firebasestorage.app',
  messagingSenderId: '1016868477506',
  appId: '1:1016868477506:web:515c9eee14f5c86343abdb',
});

const messaging = firebase.messaging();

// Offer pushes are wake-only: show a notification so the driver taps back in, where the app
// re-fetches the authoritative pending offer over REST (mirrors the foreground onMessage path
// in notifications.ts). We do not trust the push body as the source of truth.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'New job offer';
  const body =
    (payload.notification && payload.notification.body) || 'Open Vahnly to view the offer.';
  self.registration.showNotification(title, {
    body,
    tag: 'vahnly-offer', // collapse repeats into one notification
    renotify: true,
    data: payload.data || {},
  });
});

// Tapping the notification focuses an open Vahnly tab, or opens the driver home.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/driver/');
    })
  );
});
