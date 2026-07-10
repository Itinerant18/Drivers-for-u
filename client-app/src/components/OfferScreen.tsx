'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOfferStore } from '@/store/useOfferStore';
import { useToastStore } from '@/store/useToastStore';
import { friendlyError } from '@/lib/ui/errorMessage';
import { FareDisplay } from '@/components/ds/redesign';

// ─── Countdown Bar ─────────────────────────────────────────────────────────────
// Full-width bar at very top. Drains left-to-right. More visible in peripheral
// vision than a circular ring — critical when phone is dashboard-mounted.

function CountdownBar({ remaining, total = 15 }: { remaining: number; total?: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  return (
    <div className="h-1.5 w-full bg-gray-100">
      <div
        className="h-full transition-[width] duration-500 linear rounded-r-sm"
        style={{
          width: `${pct}%`,
          background: pct > 40
            ? 'var(--warning-400)'
            : `linear-gradient(90deg, var(--negative-400), var(--warning-400))`,
        }}
      />
    </div>
  );
}

// ─── Info Cell ─────────────────────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-sm p-300 flex flex-col gap-100">
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary">
        {label}
      </span>
      <span className="text-label-medium font-sans font-semibold text-content-primary">
        {value}
      </span>
    </div>
  );
}

// ─── Decline Reason Picker (post-decline, optional) ────────────────────────────

const DECLINE_REASONS = [
  'Too far away',
  'Low payout',
  'Unfamiliar area',
  'Personal reason',
  'Vehicle issue',
] as const;

function DeclineReasonSheet({ onSelect, onSkip }: { onSelect: (r: string) => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end animate-enter">
      <div className="w-full bg-background-primary rounded-t-lg p-500 pb-[calc(var(--space-500)+env(safe-area-inset-bottom,0px))] space-y-400">
        <h3 className="text-label-large font-sans font-semibold text-content-primary">
          Why did you decline?
        </h3>
        <p className="text-paragraph-small text-content-secondary">
          Optional — helps us improve matching.
        </p>
        <div className="flex flex-wrap gap-200">
          {DECLINE_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => onSelect(reason)}
              className="px-400 py-300 rounded-pill border border-border-opaque text-label-small
                text-content-secondary hover:bg-gray-50 active:bg-gray-100 transition-base cursor-pointer"
            >
              {reason}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-full h-11 rounded-sm text-label-medium text-content-tertiary
            hover:text-content-secondary transition-base cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ─── Main Offer Screen ─────────────────────────────────────────────────────────
// Full-screen takeover. THE most important screen in the entire app.
// Design principle: "One glance to understand. One tap to act."

export function OfferScreen() {
  const { token, user } = useAuthStore();
  const { currentOffer, status, offerExpiresAt, acceptOffer, declineOffer, reconcilePendingOffer } = useOfferStore();
  const [remaining, setRemaining] = useState(15);
  const [accepting, setAccepting] = useState(false);
  const [showDeclineReasons, setShowDeclineReasons] = useState(false);
  const expiredRef = useRef(false);
  const driverID = user?.id || '';

  // Reconcile on mount
  useEffect(() => {
    if (status === 'OFFER_PENDING') {
      expiredRef.current = false;
      setShowDeclineReasons(false);
      if (token) reconcilePendingOffer(token);
    }
  }, [currentOffer?.orderId, status, token, reconcilePendingOffer]);

  // Audible + haptic alert — drivers keep the phone mounted and can't watch the
  // screen; the 15s window is missed without a hard signal.
  useEffect(() => {
    if (status !== 'OFFER_PENDING' || !currentOffer?.orderId) return;
    // Vibrate: strong triple-burst pattern
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([300, 150, 300, 150, 300]); } catch { /* unsupported */ }
    }
    // Audio: two sharp 880Hz beeps
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [0, 0.35].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.3);
      });
      window.setTimeout(() => void ctx.close(), 1200);
    } catch { /* autoplay policy may block */ }
  }, [status, currentOffer?.orderId]);

  // Clock-accurate countdown
  useEffect(() => {
    if (status !== 'OFFER_PENDING') return;
    const tick = () => {
      const expiry = offerExpiresAt ?? Date.now() + 15000;
      const secs = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        if (token) declineOffer(token, driverID, 'TIMEOUT');
      }
    };
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [status, offerExpiresAt, token, declineOffer, driverID]);

  if (status !== 'OFFER_PENDING' || !currentOffer) return null;

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!token || accepting) return;
    setAccepting(true);
    try {
      await acceptOffer(token, driverID);
    } catch (e) {
      useToastStore.getState().show(friendlyError(e), 'error');
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    if (!token) return;
    declineOffer(token, driverID, 'MANUAL');
    setShowDeclineReasons(true);
  };

  const handleDeclineReason = (reason: string) => {
    // Fire-and-forget: log the reason for analytics
    setShowDeclineReasons(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 bg-background-primary flex flex-col animate-enter">
        {/* ── Countdown Bar (top) ── */}
        <div className="flex-shrink-0 pt-[env(safe-area-inset-top,0px)]">
          <CountdownBar remaining={remaining} />
        </div>

        {/* ── Header: Badge + Timer ── */}
        <div className="flex items-center justify-between px-500 py-400">
          <div className="flex items-center gap-300">
            <span className="flex items-center gap-200 bg-warning-50 border border-warning-400 
              rounded-sm px-300 py-200 text-[11px] font-mono font-bold text-content-warning uppercase">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Incoming Job
            </span>
          </div>
          <span className={`text-xl font-mono font-bold tabular-nums ${
            remaining <= 5 ? 'text-content-negative' : 'text-content-warning'
          }`}>
            {remaining}s
          </span>
        </div>

        {/* ── Hero: Payout Amount ── */}
        <div className="text-center px-500 pb-400">
          {/* fareEstimate is paise; redesign FareDisplay renders rupees */}
          <FareDisplay
            amount={Math.round((currentOffer.fareEstimate ?? 0) / 100)}
            size="lg"
            className="text-[36px] font-serif font-semibold text-accent-600 block"
          />
          <span className="text-[11px] font-sans text-content-tertiary mt-100 block">
            Estimated payout
          </span>
        </div>

        {/* ── Info Grid (2×2) ── */}
        <div className="grid grid-cols-2 gap-300 px-500 pb-400">
          <InfoCell label="Trip distance" value={currentOffer.distanceKm ? `${currentOffer.distanceKm.toFixed(1)} km` : '—'} />
          <InfoCell label="Duration" value={currentOffer.durationMinutes ? `~${currentOffer.durationMinutes} min` : '—'} />
          <InfoCell label="Pickup" value={currentOffer.pickup?.address || '—'} />
          <InfoCell label="Drop" value={currentOffer.drop?.address || '—'} />
        </div>

        {/* ── Vehicle + Rider Strip ── */}
        <div className="mx-500 rounded-sm bg-gray-50 border border-border-opaque p-300 flex items-center gap-300 mb-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-content-secondary flex-shrink-0">
            <path d="M5 17h14M7 11l1.5-4h7L17 11M6 17V11h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="15.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <div className="flex-1 min-w-0">
            <span className="text-label-small font-sans font-semibold text-content-primary block truncate">
              {[currentOffer.carMake, currentOffer.carModel].filter(Boolean).join(' ') || 'Vehicle'} · {currentOffer.carTransmission || 'Manual'}
            </span>
            <span className="text-[10px] font-sans text-content-tertiary block truncate">
              {currentOffer.carType || ''} · {currentOffer.tripType === 'CITY' ? 'In-city' : currentOffer.tripType || 'In-city'}
            </span>
          </div>
          <div className="flex items-center gap-200 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-content-tertiary">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] font-sans text-content-secondary">
              {currentOffer.riderName || 'Rider'}
              {currentOffer.riderRating ? ` ★${currentOffer.riderRating}` : ''}
            </span>
          </div>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Accept Button (THE primary action) ── */}
        <div className="px-500 pb-300">
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="w-full h-16 rounded-sm bg-accent-400 hover:bg-accent-500
              active:scale-[0.98] text-gray-0 font-sans font-bold text-lg
              flex items-center justify-center gap-300
              shadow-elevation-2 transition-base cursor-pointer
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {accepting ? (
              <span className="animate-pulse">Accepting...</span>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ACCEPT JOB
              </>
            )}
          </button>
        </div>

        {/* ── Decline (text link, no modal during offer) ── */}
        <div className="px-500 pb-[calc(var(--space-500)+env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={handleDecline}
            className="w-full h-11 text-label-medium text-content-tertiary
              hover:text-content-secondary transition-base cursor-pointer"
          >
            Decline this job
          </button>
        </div>
      </div>

      {/* ── Post-Decline Reason Sheet ── */}
      {showDeclineReasons && (
        <DeclineReasonSheet
          onSelect={handleDeclineReason}
          onSkip={() => setShowDeclineReasons(false)}
        />
      )}
    </>
  );
}
