'use client';

import React, { useEffect, useState } from 'react';
import { getDriverNotifications, markNotificationRead, DriverNotification } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationsScreen } from '@/components/account/NotificationsScreen';

type NotificationItem = React.ComponentProps<typeof NotificationsScreen>['notifications'][number];

const CATEGORY_TO_TYPE: Record<DriverNotification['category'], NotificationItem['type']> = {
  ALL: 'SYSTEM',
  TRIPS: 'OFFER',
  EARNINGS: 'PAYMENT',
  PROMOTIONS: 'PROMO',
  SYSTEM: 'SYSTEM',
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  // API sends ISO timestamps; keep the raw string if it's already relative text.
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DriverNotificationsPage() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);

  useEffect(() => {
    if (!token) return;
    getDriverNotifications(token)
      .then(setNotifications)
      .catch((err) => console.warn('Failed to fetch notifications:', err));
  }, [token]);

  const markRead = (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.is_read) return;

    // Optimistically mark read, then persist; revert on failure.
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    if (!token) return;
    markNotificationRead(token, id).catch((err) => {
      console.warn('Failed to mark notification read:', err);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
    });
  };

  const markAllRead = () => {
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (!token) return;
    unread.forEach((n) => {
      markNotificationRead(token, n.id).catch((err) =>
        console.warn('Failed to mark notification read:', err),
      );
    });
  };

  const items: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    type: CATEGORY_TO_TYPE[n.category] ?? 'SYSTEM',
    title: n.title,
    body: n.body,
    timestamp: formatTimestamp(n.timestamp),
    isRead: n.is_read,
  }));

  return (
    <NotificationsScreen
      notifications={items}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
      onNotificationPress={() => {}} // ponytail: no notification detail route or actionUrl exists yet
    />
  );
}
