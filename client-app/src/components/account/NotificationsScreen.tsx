'use client';

import React, { useState } from 'react';
import { StatusBadge, EmptyState } from '@/components/ds/redesign';

// ─── Notifications Inbox ───────────────────────────────────────────────────────
// All notifications in one place — grouped by date.
// Unread have left accent border. Tap to view detail.

type NotificationType = 'OFFER' | 'PAYMENT' | 'SYSTEM' | 'PROMO' | 'SAFETY';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string; // relative, e.g. "2h ago"
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationsScreenProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNotificationPress: (id: string) => void;
}

export function NotificationsScreen({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNotificationPress,
}: NotificationsScreenProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-primary">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-500 pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        flex items-center justify-between border-b border-border-opaque">
        <div>
          <h1 className="text-xl font-sans font-bold text-content-primary">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-[11px] font-mono text-content-secondary">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[11px] font-sans font-semibold text-accent-500 hover:text-accent-600 cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 && (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="All caught up!"
            description="No notifications right now"
          />
        )}

        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onPress={() => {
              if (!notification.isRead) onMarkRead(notification.id);
              onNotificationPress(notification.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Notification Row ──────────────────────────────────────────────────────────

const TYPE_ICONS: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  OFFER: {
    icon: <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    color: 'text-accent-500 bg-accent-50',
  },
  PAYMENT: {
    icon: <><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" /></>,
    color: 'text-positive-400 bg-positive-50',
  },
  SYSTEM: {
    icon: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06" stroke="currentColor" strokeWidth="1.5" /></>,
    color: 'text-content-secondary bg-gray-50',
  },
  PROMO: {
    icon: <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    color: 'text-warning-400 bg-warning-50',
  },
  SAFETY: {
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" /></>,
    color: 'text-negative-400 bg-negative-50',
  },
};

function NotificationRow({ notification, onPress }: { notification: NotificationItem; onPress: () => void }) {
  const typeConfig = TYPE_ICONS[notification.type];
  return (
    <button
      type="button"
      onClick={onPress}
      className={`w-full text-left flex items-start gap-300 px-500 py-400
        border-b border-border-opaque hover:bg-gray-50 transition-base cursor-pointer
        ${!notification.isRead ? 'border-l-2 border-l-accent-400' : ''}`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">{typeConfig.icon}</svg>
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-label-small font-sans block truncate
          ${!notification.isRead ? 'font-semibold text-content-primary' : 'font-medium text-content-secondary'}`}>
          {notification.title}
        </span>
        <span className="text-[11px] font-sans text-content-tertiary block truncate mt-100">
          {notification.body}
        </span>
      </div>
      <span className="text-[9px] font-mono text-content-tertiary flex-shrink-0 mt-100">
        {notification.timestamp}
      </span>
    </button>
  );
}
