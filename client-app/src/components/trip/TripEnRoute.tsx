'use client';

import React from 'react';
import { openGoogleMapsNavigation } from '@/lib/map/navigation';
import { SosFloatingButton } from '@/components/SosFloatingButton';

// ─── En-Route to Pickup ────────────────────────────────────────────────────────
// Driver accepted → heading to pick up the rider's car.
// Primary action: NAVIGATE (1 tap to Google Maps)
// Secondary: I'VE ARRIVED (auto-enables when GPS confirms < 200m)

interface TripEnRouteProps {
  pickupAddress: string;
  pickupSubtext?: string;
  etaMinutes: number;
  distanceKm: number;
  riderName: string;
  riderRating: number;
  vehicleInfo: string;
  vehiclePlate: string;
  pickupLat: number;
  pickupLng: number;
  isNearPickup: boolean; // GPS < 200m
  onNavigate: () => void;
  onArrived: () => void;
  onCall: () => void;
  onChat: () => void;
  onCancel: () => void;
}

export function TripEnRoute({
  pickupAddress,
  pickupSubtext,
  etaMinutes,
  distanceKm,
  riderName,
  riderRating,
  vehicleInfo,
  vehiclePlate,
  pickupLat,
  pickupLng,
  isNearPickup,
  onNavigate,
  onArrived,
  onCall,
  onChat,
  onCancel,
}: TripEnRouteProps) {
  return (
    <div className="flex flex-col h-screen bg-background-primary">
      {/* ── Active Header ── */}
      <div className="flex-shrink-0 bg-forest-400 text-gray-0 px-500
        pt-[calc(var(--space-400)+env(safe-area-inset-top,0px))] pb-400
        flex items-center justify-between">
        <span className="flex items-center gap-300 text-label-small font-sans font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h4l3-9 4 18 3-9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Heading to pickup
        </span>
        <span className="text-[11px] font-mono font-medium opacity-85">
          ETA {etaMinutes} min{distanceKm > 0 ? ` · ${distanceKm.toFixed(1)} km` : ''}
        </span>
      </div>

      {/* ── Map Placeholder (30% height) ── */}
      <div className="flex-shrink-0 h-[30vh] bg-gray-50 flex items-center justify-center relative">
        <span className="text-content-tertiary text-[11px] font-mono">Map → Pickup route</span>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Pickup address */}
        <div className="px-500 py-400 border-b border-border-opaque flex items-start gap-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-500 flex-shrink-0 mt-0.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div>
            <span className="text-base font-sans font-semibold text-content-primary block">
              {pickupAddress}
            </span>
            {pickupSubtext && (
              <span className="text-[12px] font-sans text-content-secondary mt-100 block">
                {pickupSubtext}
              </span>
            )}
          </div>
        </div>

        {/* Rider strip + Call/Chat */}
        <div className="px-500 py-300 border-b border-border-opaque flex items-center gap-300">
          <div className="w-9 h-9 rounded-full bg-accent-50 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-500">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="flex-1 text-label-medium font-sans font-semibold text-content-primary">
            {riderName}{' '}
            {riderRating > 0 && <span className="text-content-warning font-mono text-[11px]">★ {riderRating.toFixed(1)}</span>}
          </span>
          {/* Call */}
          <button
            type="button"
            onClick={onCall}
            aria-label="Call rider"
            className="w-11 h-11 rounded-full bg-accent-50 border border-accent-200
              flex items-center justify-center text-accent-500
              hover:bg-accent-100 active:scale-95 transition-base cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.08 5.18 2 2 0 015.08 3h3a2 2 0 012 1.72c.13 1 .36 1.97.7 2.9a2 2 0 01-.45 2.11L9.09 11a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.34 1.9.57 2.9.7a2 2 0 011.72 2z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {/* Chat */}
          <button
            type="button"
            onClick={onChat}
            aria-label="Message rider"
            className="w-11 h-11 rounded-full bg-accent-50 border border-accent-200
              flex items-center justify-center text-accent-500
              hover:bg-accent-100 active:scale-95 transition-base cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Vehicle info */}
        <div className="px-500 py-300 text-[11px] font-mono text-content-secondary flex items-center gap-200">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-content-tertiary">
            <path d="M5 17h14M7 11l1.5-4h7L17 11M6 17V11h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {[vehicleInfo, vehiclePlate].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* ── Action Buttons (bottom) ── */}
      <div className="flex-shrink-0 px-500 pb-[calc(var(--space-400)+env(safe-area-inset-bottom,0px))] space-y-300">
        {/* Navigate = PRIMARY */}
        <button
          type="button"
          onClick={onNavigate}
          className="w-full h-[52px] rounded-sm bg-[#1E40AF] hover:bg-[#1E3A8A]
            active:scale-[0.98] text-gray-0 font-sans font-bold text-sm
            flex items-center justify-center gap-300
            shadow-elevation-1 transition-base cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          NAVIGATE (Google Maps)
        </button>

        {/* I've Arrived = SECONDARY (disabled until near) */}
        <button
          type="button"
          onClick={onArrived}
          disabled={!isNearPickup}
          className={`w-full h-12 rounded-sm font-sans font-semibold text-sm
            flex items-center justify-center gap-300 transition-base
            ${isNearPickup
              ? 'bg-accent-50 border-2 border-accent-400 text-accent-600 hover:bg-accent-100 cursor-pointer active:scale-[0.98]'
              : 'bg-gray-50 border border-border-opaque text-content-tertiary cursor-not-allowed'
            }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {isNearPickup ? "I'VE ARRIVED" : "I'VE ARRIVED (get closer)"}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full h-9 text-[12px] font-sans text-content-tertiary
            hover:text-content-negative transition-base cursor-pointer"
        >
          ⚠️ Cancel trip
        </button>
      </div>

      {/* ── SOS Float ── */}
      <SosFloatingButton />
    </div>
  );
}
