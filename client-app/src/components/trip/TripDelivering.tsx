'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SosFloatingButton } from '@/components/SosFloatingButton';

// ─── Trip Delivering (Active Job) ──────────────────────────────────────────────
// Driver is actively driving the rider's car. The CORE screen during a job.
// Key elements:
// - Live running fare (motivational — primary visual)
// - Elapsed time + distance
// - Drop address + ETA
// - Action grid: Navigate, Call, Report Issue
// - Slide-to-end (prevents accidental "End Job" taps — NOT time-pressured here)

interface TripDeliveringProps {
  fareEstimate: number;
  fareRunning: number; // Live fare accumulating
  elapsedMinutes: number;
  distanceKm: number;
  dropAddress: string;
  etaMinutes: number;
  riderName: string;
  onNavigate: () => void;
  onCall: () => void;
  onReportIssue: () => void;
  onEndTrip: () => void;
}

export function TripDelivering({
  fareEstimate,
  fareRunning,
  elapsedMinutes,
  distanceKm,
  dropAddress,
  etaMinutes,
  riderName,
  onNavigate,
  onCall,
  onReportIssue,
  onEndTrip,
}: TripDeliveringProps) {
  // Slide-to-end logic
  const [slideProgress, setSlideProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = () => setIsDragging(true);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSlideProgress(pct);
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    if (slideProgress >= 90) {
      onEndTrip();
    } else {
      setSlideProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      {/* ── Active Header ── */}
      <div className="flex-shrink-0 bg-forest-400 text-gray-0 px-500
        pt-[calc(var(--space-400)+env(safe-area-inset-top,0px))] pb-400
        flex items-center justify-between">
        <span className="flex items-center gap-300 text-label-small font-sans font-semibold">
          <span className="w-2 h-2 rounded-full bg-positive-400 animate-pulse" />
          Job in progress
        </span>
        <span className="text-[11px] font-mono font-medium opacity-85">
          {elapsedMinutes > 0 || distanceKm > 0 ? `${elapsedMinutes} min · ${distanceKm.toFixed(1)} km` : 'In progress'}
        </span>
      </div>

      {/* ── Map area (30%) ── */}
      <div className="flex-shrink-0 h-[30vh] bg-gray-50 flex items-center justify-center relative">
        <span className="text-content-tertiary text-[11px] font-mono">Map → Drop route</span>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-500 py-400 space-y-400">
        {/* Live Fare (HERO — motivational) */}
        <div className="text-center py-300">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-100">
            Running fare
          </span>
          <span className="text-[40px] font-serif font-semibold text-accent-600 block tabular-nums leading-none">
            ₹{fareRunning.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-mono text-content-tertiary mt-200 block">
            Est. total: ₹{fareEstimate.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Trip stats row */}
        <div className="flex justify-between items-center bg-gray-50 rounded-sm px-400 py-300">
          <div className="text-center">
            <span className="text-sm font-mono font-bold text-content-primary block tabular-nums">{elapsedMinutes} min</span>
            <span className="text-[8px] font-mono text-content-tertiary uppercase">Elapsed</span>
          </div>
          <div className="w-px h-6 bg-border-opaque" />
          <div className="text-center">
            <span className="text-sm font-mono font-bold text-content-primary block tabular-nums">{distanceKm.toFixed(1)} km</span>
            <span className="text-[8px] font-mono text-content-tertiary uppercase">Covered</span>
          </div>
          <div className="w-px h-6 bg-border-opaque" />
          <div className="text-center">
            <span className="text-sm font-mono font-bold text-content-primary block tabular-nums">{etaMinutes} min</span>
            <span className="text-[8px] font-mono text-content-tertiary uppercase">ETA</span>
          </div>
        </div>

        {/* Drop address */}
        <div className="flex items-start gap-300 rounded-sm border border-border-opaque p-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-negative-400 flex-shrink-0 mt-0.5">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <span className="text-[10px] font-mono font-semibold text-content-tertiary uppercase block">Drop-off</span>
            <span className="text-label-medium font-sans font-semibold text-content-primary">
              {dropAddress}
            </span>
          </div>
        </div>

        {/* Action Grid (3-across) */}
        <div className="grid grid-cols-3 gap-300">
          <ActionTile
            icon={<path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
            label="Navigate"
            onClick={onNavigate}
            accent
          />
          <ActionTile
            icon={<path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.08 5.18 2 2 0 015.08 3h3a2 2 0 012 1.72c.13 1 .36 1.97.7 2.9a2 2 0 01-.45 2.11L9.09 11a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.34 1.9.57 2.9.7a2 2 0 011.72 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
            label="Call"
            onClick={onCall}
          />
          <ActionTile
            icon={<><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /></>}
            label="Issue"
            onClick={onReportIssue}
          />
        </div>
      </div>

      {/* ── Slide to End Job (bottom) ── */}
      <div className="flex-shrink-0 px-500 pb-[calc(var(--space-500)+env(safe-area-inset-bottom,0px))]">
        <div
          ref={trackRef}
          className="relative h-14 rounded-sm bg-gray-100 border border-border-opaque overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 bg-negative-50 transition-[width] duration-75"
            style={{ width: `${slideProgress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1 bottom-1 left-1 w-12 rounded-sm bg-negative-400
              flex items-center justify-center text-gray-0 shadow-elevation-1
              transition-transform duration-75"
            style={{ transform: `translateX(${(slideProgress / 100) * ((trackRef.current?.offsetWidth ?? 300) - 56)}px)` }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {/* Label */}
          <span className="absolute inset-0 flex items-center justify-center
            text-[12px] font-sans font-semibold text-content-tertiary pointer-events-none">
            Slide to end job →
          </span>
        </div>
      </div>

      <SosFloatingButton />
    </div>
  );
}

// ─── Action Tile ────────────────────────────────────────────────────────────────

function ActionTile({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-200 h-[68px] rounded-sm
        border transition-base cursor-pointer active:scale-95
        ${accent
          ? 'bg-accent-50 border-accent-200 text-accent-600'
          : 'bg-background-primary border-border-opaque text-content-secondary hover:text-content-primary'
        }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{icon}</svg>
      <span className="text-[9px] font-mono font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}
