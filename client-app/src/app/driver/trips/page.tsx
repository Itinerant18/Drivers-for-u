'use client';

import React, { useState } from 'react';
import AuthGuard from '../../../components/AuthGuard';
import { TabBar } from '@/components/TabBar';
import TripHistoryList from '../../driver-account/trip-history/page';
import { ClockIcon } from '@/components/ds';

type TripsTab = 'UPCOMING' | 'HISTORY';

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

        {tab === 'UPCOMING' ? (
          /* Empty state teaches the feature until the scheduled-bookings
             backend (redesign plan P3) ships — no fabricated rows. */
          <div className="card text-center py-10 space-y-3">
            <span className="mx-auto h-12 w-12 rounded-pill bg-accent-50 text-content-accent flex items-center justify-center">
              <ClockIcon size={24} />
            </span>
            <h2 className="text-heading-small">No scheduled bookings</h2>
            <p className="text-paragraph-small text-content-secondary max-w-xs mx-auto">
              Riders can book drivers in advance. Scheduled trips assigned to you
              will appear here with accept and reminder options.
            </p>
          </div>
        ) : (
          <TripHistoryList />
        )}
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
