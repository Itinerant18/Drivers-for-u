'use client';

import React, { useEffect, useState } from 'react';
import AuthGuard from '../../../components/AuthGuard';
import { TabBar } from '@/components/TabBar';
import TripHistoryList from '../../driver-account/trip-history/page';
import { ClockIcon, FareDisplay } from '@/components/ds';
import { getUpcomingTrips, UpcomingTrip } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

type TripsTab = 'UPCOMING' | 'HISTORY';

function UpcomingList() {
  const { token } = useAuthStore();
  const [trips, setTrips] = useState<UpcomingTrip[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getUpcomingTrips(token)
      .then((res) => {
        if (!cancelled) setTrips(res.trips ?? []);
      })
      .catch(() => {
        if (!cancelled) setTrips([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (trips === null) {
    return <div className="skeleton h-24 w-full" aria-label="Loading upcoming trips" />;
  }

  if (trips.length === 0) {
    return (
      /* Empty state teaches the feature — no fabricated rows. */
      <div className="card text-center py-10 space-y-3">
        <span className="mx-auto h-12 w-12 rounded-pill bg-accent-50 text-content-accent flex items-center justify-center">
          <ClockIcon size={24} />
        </span>
        <h2 className="text-heading-small">No scheduled bookings</h2>
        <p className="text-paragraph-small text-content-secondary max-w-xs mx-auto">
          Riders can book drivers in advance. Scheduled trips assigned to you
          appear here; offers for them arrive shortly before the start time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {trips.map((t) => {
        const when = new Date(t.scheduled_at);
        return (
          <div key={t.id} className="card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-label-large">
                {when.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                {' · '}
                <span className="font-mono tabular-nums">
                  {when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
              <p className="text-paragraph-small text-content-secondary mt-0.5">
                {t.trip_type.replaceAll('_', ' ')} · pickup {t.pickup_lat.toFixed(4)}, {t.pickup_lng.toFixed(4)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <FareDisplay amount={t.base_fare_paise} size="md" />
              <span className="badge badge-accent mt-1">{t.status.replaceAll('_', ' ')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TripsContent() {
  const [tab, setTab] = useState<TripsTab>('UPCOMING');

  return (
    <div className="min-h-screen bg-background-primary text-content-primary font-sans">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-5">
        <header>
          <h1 className="text-display-serif text-[28px]">Trips</h1>
        </header>

        {/* Tab switch */}
        <div className="flex bg-background-secondary p-1 rounded-sm border border-border-opaque">
          {(['UPCOMING', 'HISTORY'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 h-10 rounded-sm text-label-medium transition-base cursor-pointer ${
                tab === t
                  ? 'bg-interactive-primary text-interactive-primary-text font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {t === 'UPCOMING' ? 'Upcoming' : 'History'}
            </button>
          ))}
        </div>

        {tab === 'UPCOMING' ? <UpcomingList /> : <TripHistoryList />}
      </div>
      <TabBar />
    </div>
  );
}

export default function DriverTripsPage() {
  return (
    <AuthGuard allowedRole="DRIVER">
      <TripsContent />
    </AuthGuard>
  );
}
