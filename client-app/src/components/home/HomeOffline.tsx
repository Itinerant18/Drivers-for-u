'use client';

import React from 'react';

// ─── Home Offline State ────────────────────────────────────────────────────────
// When the driver is OFFLINE, the screen is minimal and focused:
// - No map (saves battery and data)
// - Big circular GO ONLINE button (unmissable primary action)
// - Today's summary stats as motivation
// - Upcoming scheduled job nudge (if any)

interface HomeOfflineProps {
  driverName: string;
  stats: {
    tripsCount: number;
    earningsRupees: number;
    onlineHours: number;
    rating: number;
    acceptanceRate: number;
  };
  upcomingJob?: {
    time: string;
    type: string;
    fare: number;
  } | null;
  onGoOnline: () => void;
  isTransitioning?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeOffline({
  driverName,
  stats,
  upcomingJob,
  onGoOnline,
  isTransitioning = false,
}: HomeOfflineProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-500 py-800">
      {/* Avatar */}
      <div className="w-[72px] h-[72px] rounded-full bg-accent-50 border border-accent-200
        flex items-center justify-center mb-300">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-accent-500">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Greeting */}
      <h1 className="font-serif text-2xl font-medium text-content-primary mb-100">
        {getGreeting()}, {driverName}
      </h1>
      <p className="text-label-small font-mono text-content-tertiary mb-800">
        ★ {stats.rating.toFixed(2)} · KOL Hub
      </p>

      {/* GO ONLINE Button */}
      <button
        type="button"
        onClick={onGoOnline}
        disabled={isTransitioning}
        className="w-[120px] h-[120px] rounded-full bg-accent-400 hover:bg-accent-500
          active:scale-95 flex flex-col items-center justify-center gap-200
          text-gray-0 shadow-[0_8px_32px_rgba(122,158,126,0.4)]
          transition-all duration-300 ease-out cursor-pointer
          disabled:opacity-60 disabled:cursor-not-allowed mb-900"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-sans font-bold uppercase tracking-wider">
          {isTransitioning ? 'Starting...' : 'Go Online'}
        </span>
      </button>

      {/* Today's Stats (2×2 grid) */}
      <div className="grid grid-cols-2 gap-300 w-full max-w-xs">
        <StatCard value={`${stats.tripsCount}`} label="Jobs today" />
        <StatCard value={`₹${stats.earningsRupees.toLocaleString('en-IN')}`} label="Earned" />
        <StatCard value={`${stats.onlineHours.toFixed(1)}h`} label="Online" />
        <StatCard value={`${Math.round(stats.acceptanceRate)}%`} label="Acceptance" />
      </div>

      {/* Upcoming Job Nudge */}
      {upcomingJob && (
        <div className="mt-500 w-full max-w-xs rounded-sm bg-accent-50 border border-accent-200
          p-400 flex items-center gap-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-500 flex-shrink-0">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="flex-1 min-w-0">
            <span className="text-label-small font-sans font-semibold text-content-primary block">
              Upcoming: {upcomingJob.time}
            </span>
            <span className="text-[10px] font-sans text-content-secondary">
              {upcomingJob.type} · ₹{upcomingJob.fare}
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-content-tertiary">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-background-primary border border-border-opaque rounded-sm p-400 text-center">
      <span className="text-lg font-mono font-bold text-content-primary block tabular-nums">
        {value}
      </span>
      <span className="text-[9px] font-mono font-medium text-content-tertiary uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
