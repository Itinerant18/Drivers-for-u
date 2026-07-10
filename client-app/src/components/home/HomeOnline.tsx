'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Lazy-load map only when ONLINE (saves bundle on offline state)
const DriverMap = dynamic(() => import('@/components/map/DriverMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-50 animate-pulse rounded-sm" />,
});

// ─── Home Online State (Seeking) ───────────────────────────────────────────────
// Compact map (40% height) + seeking indicator + stats
// Driver knows: "I'm online, system is looking, here's my performance today"

interface HomeOnlineProps {
  connectionStatus: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
  stats: {
    tripsCount: number;
    earningsRupees: number;
    acceptanceRate: number;
    rating: number;
  };
  gpsError: string | null;
  cooldownSecs: number;
  tripFilter: 'ALL' | 'CITY' | 'OUTSTATION';
  onTripFilterChange: (filter: 'ALL' | 'CITY' | 'OUTSTATION') => void;
  onGoOffline: () => void;
  onReconnect: () => void;
}

export function HomeOnline({
  connectionStatus,
  stats,
  gpsError,
  cooldownSecs,
  tripFilter,
  onTripFilterChange,
  onGoOffline,
  onReconnect,
}: HomeOnlineProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* ── Connection Status Bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-500 py-300
        border-b border-border-opaque">
        <ConnectionPill status={connectionStatus} onReconnect={onReconnect} />
        <span className="text-[10px] font-mono text-content-tertiary">
          {connectionStatus === 'CONNECTED' && (
            <span className="text-content-positive flex items-center gap-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
              </svg>
              Connected
            </span>
          )}
        </span>
      </div>

      {/* ── GPS Error Banner ── */}
      {gpsError && (
        <div className="flex-shrink-0 bg-negative-50 border-b border-negative-400 px-500 py-300
          flex items-center gap-300 text-[11px] font-sans text-content-negative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {gpsError}
        </div>
      )}

      {/* ── Map Area (40% of viewport) ── */}
      <div className="flex-shrink-0 h-[40vh] relative">
        <DriverMap />
      </div>

      {/* ── Content below map ── */}
      <div className="flex-1 overflow-y-auto px-500 py-400 space-y-400">
        {/* Seeking Indicator OR Cooldown */}
        {cooldownSecs > 0 ? (
          <CooldownCard seconds={cooldownSecs} />
        ) : (
          <SeekingCard />
        )}

        {/* Quick Stats Row */}
        <div className="flex justify-between items-center bg-gray-50 rounded-sm px-400 py-300">
          <MiniStat value={`${stats.tripsCount}`} label="Jobs" />
          <MiniStat value={`₹${stats.earningsRupees.toLocaleString('en-IN')}`} label="Earned" />
          <MiniStat value={`${stats.acceptanceRate}%`} label="Accept" />
          <MiniStat value={`★${stats.rating.toFixed(1)}`} label="Rating" />
        </div>

        {/* Trip Type Filter */}
        <div className="flex gap-200">
          {(['ALL', 'CITY', 'OUTSTATION'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onTripFilterChange(filter)}
              className={`flex-1 h-9 rounded-pill text-[10px] font-mono font-semibold uppercase
                tracking-wider transition-base cursor-pointer
                ${tripFilter === filter
                  ? 'bg-forest-400 text-gray-0'
                  : 'bg-background-primary border border-border-opaque text-content-secondary hover:text-content-primary'
                }`}
            >
              {filter === 'ALL' ? 'All jobs' : filter === 'CITY' ? 'City only' : 'Outstation'}
            </button>
          ))}
        </div>

        {/* Go Offline */}
        <div className="text-center pt-200">
          <button
            type="button"
            onClick={onGoOffline}
            className="inline-flex items-center gap-200 px-500 py-300 rounded-sm
              bg-negative-50 border border-negative-400 text-content-negative
              text-label-small font-sans font-semibold
              hover:bg-negative-100 active:scale-[0.98] transition-base cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Go Offline
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function ConnectionPill({ status, onReconnect }: { status: string; onReconnect: () => void }) {
  const config = {
    CONNECTED: { dot: 'bg-positive-400', text: 'ONLINE · KOL', bg: 'bg-positive-50 border-positive-400' },
    RECONNECTING: { dot: 'bg-warning-400 animate-pulse', text: 'Reconnecting...', bg: 'bg-warning-50 border-warning-400' },
    DISCONNECTED: { dot: 'bg-negative-400', text: 'Disconnected', bg: 'bg-negative-50 border-negative-400' },
  }[status] || { dot: 'bg-gray-400', text: 'Unknown', bg: 'bg-gray-50 border-border-opaque' };

  return (
    <button
      type="button"
      onClick={status === 'DISCONNECTED' ? onReconnect : undefined}
      className={`inline-flex items-center gap-200 px-300 py-200 rounded-pill border
        text-[11px] font-mono font-bold uppercase tracking-wider ${config.bg}
        ${status === 'DISCONNECTED' ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.text}
    </button>
  );
}

function SeekingCard() {
  return (
    <div className="flex items-center gap-300 rounded-sm bg-accent-50 border-l-2 border-accent-400 p-400">
      {/* Pulse ring */}
      <span className="relative flex-shrink-0 w-5 h-5">
        <span className="absolute inset-0 rounded-full bg-accent-400 animate-ping opacity-30" />
        <span className="relative block w-5 h-5 rounded-full bg-accent-400" />
      </span>
      <div>
        <span className="text-label-small font-sans font-semibold text-content-primary block">
          Seeking matches...
        </span>
        <span className="text-[11px] font-sans text-content-secondary">
          Looking for your next job nearby
        </span>
      </div>
    </div>
  );
}

function CooldownCard({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className="flex items-center gap-300 rounded-sm bg-warning-50 border-l-2 border-warning-400 p-400">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-content-warning flex-shrink-0">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div>
        <span className="text-label-small font-sans font-semibold text-content-warning block">
          Cooldown: {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <span className="text-[11px] font-sans text-content-secondary">
          Brief pause after declining
        </span>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <span className="text-sm font-mono font-bold text-content-primary block tabular-nums">{value}</span>
      <span className="text-[8px] font-mono text-content-tertiary uppercase">{label}</span>
    </div>
  );
}
