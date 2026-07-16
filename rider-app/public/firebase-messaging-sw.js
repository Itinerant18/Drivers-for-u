/* firebase-messaging-sw.js — FCM background-message handler for the Vahnly rider app.
 *
 * Required for web push: getToken() (in src/lib/notifications.ts) auto-registers this file
 * at the origin root, and without it getToken() throws "failed to register a ServiceWorker"
 * and no FCM token is ever issued. A service worker cannot read process.env / NEXT_PUBLIC_*
 * (it is served as a static file, not bundled), so the Firebase web config is inlined below.
 * These are public client identifiers (not secrets — Firebase security is enforced by rules,
 * not by hiding the apiKey), and match the values the app reads from .env.local (project
 * vahnly-platform, web app "Vahnly Rider"). Keep them in sync if the app is re-registered.
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
  appId: '1:1016868477506:web:9e464b583e4f197943abdb',
});

const messaging = firebase.messaging();

// Background trip/notification pushes: show the OS notification so the rider taps back in.
// The in-app WebSocket stream is the source of truth for live trip state — the push body is
// only a wake/summary, we do not re-derive trip status from it.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Vahnly';
  const body =
    (payload.notification && payload.notification.body) || 'Open Vahnly for an update.';
  self.registration.showNotification(title, {
    body,
    tag: 'vahnly-rider',
    renotify: true,
    data: payload.data || {},
  });
});

// Tapping the notification focuses an open Vahnly tab, or opens the rider home.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/home');
    })
  );
});
