'use client';

import React, { useState } from 'react';

// ─── Trip Complete ─────────────────────────────────────────────────────────────
// Job ended. Show fare breakdown, tips, and rider rating.
// The "reward moment" — positive reinforcement to keep driving.

interface TripCompleteProps {
  fareBreakdown: {
    baseFare: number;
    distanceCharge: number;
    timeCharge: number;
    waitCharge: number;
    platformFee: number;
    total: number;
    tip?: number;
  };
  distanceKm: number;
  durationMinutes: number;
  riderName: string;
  dropAddress: string;
  onRate: (stars: number, feedback?: string) => void;
  onDone: () => void;
}

export function TripComplete({
  fareBreakdown,
  distanceKm,
  durationMinutes,
  riderName,
  dropAddress,
  onRate,
  onDone,
}: TripCompleteProps) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating > 0) onRate(rating);
    setSubmitted(true);
    setTimeout(onDone, 1200);
  };

  const payout = fareBreakdown.total - fareBreakdown.platformFee + (fareBreakdown.tip || 0);

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      {/* ── Success Header ── */}
      <div className="flex-shrink-0 bg-accent-400 text-gray-0
        pt-[calc(var(--space-600)+env(safe-area-inset-top,0px))] pb-600 px-500 text-center">
        <div className="w-14 h-14 mx-auto mb-300 rounded-full bg-white/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-xl font-sans font-bold mb-100">Job Complete!</h1>
        <p className="text-sm font-sans opacity-85">{distanceKm.toFixed(1)} km · {durationMinutes} min</p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-500 py-500 space-y-500">
        {/* Your Payout (HERO) */}
        <div className="text-center py-400 rounded-sm bg-accent-50 border border-accent-200">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-100">
            Your payout
          </span>
          <span className="text-[36px] font-serif font-semibold text-accent-600 block tabular-nums leading-none">
            ₹{payout.toLocaleString('en-IN')}
          </span>
          {fareBreakdown.tip && fareBreakdown.tip > 0 && (
            <span className="inline-flex items-center gap-200 mt-300 bg-positive-50 border border-positive-400
              rounded-pill px-300 py-100 text-[10px] font-mono font-bold text-content-positive uppercase">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              +₹{fareBreakdown.tip} tip
            </span>
          )}
        </div>

        {/* Fare Breakdown */}
        <div className="rounded-sm border border-border-opaque divide-y divide-border-opaque">
          <FareLine label="Base fare" amount={fareBreakdown.baseFare} />
          <FareLine label="Distance charge" amount={fareBreakdown.distanceCharge} sub={`${distanceKm.toFixed(1)} km`} />
          <FareLine label="Time charge" amount={fareBreakdown.timeCharge} sub={`${durationMinutes} min`} />
          {fareBreakdown.waitCharge > 0 && (
            <FareLine label="Wait charge" amount={fareBreakdown.waitCharge} />
          )}
          <FareLine label="Platform fee" amount={-fareBreakdown.platformFee} negative />
          <div className="px-400 py-300 flex items-center justify-between bg-gray-50">
            <span className="text-label-medium font-sans font-bold text-content-primary">Total payout</span>
            <span className="text-base font-mono font-bold text-accent-600 tabular-nums">
              ₹{payout.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Rate Rider */}
        <div className="rounded-sm border border-border-opaque p-400 space-y-300 text-center">
          <span className="text-label-small font-sans font-semibold text-content-primary block">
            How was {riderName}?
          </span>
          <div className="flex justify-center gap-200">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200 cursor-pointer
                  ${rating >= star
                    ? 'bg-warning-400 text-gray-0 scale-110'
                    : 'bg-gray-50 text-content-tertiary hover:bg-gray-100'
                  }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={rating >= star ? 'currentColor' : 'none'}>
                  <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-[11px] font-sans text-content-secondary">
              {rating <= 2 ? 'Sorry about that' : rating <= 4 ? 'Good interaction' : 'Excellent!'}
            </span>
          )}
        </div>
      </div>

      {/* ── Done Button ── */}
      <div className="flex-shrink-0 px-500 pb-[calc(var(--space-500)+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full h-14 rounded-sm bg-forest-400 hover:bg-forest-500
            active:scale-[0.98] text-gray-0 font-sans font-bold text-base
            flex items-center justify-center gap-300
            shadow-elevation-1 transition-base cursor-pointer"
        >
          {submitted ? '✓ Done' : 'Submit & Find Next Job'}
        </button>
      </div>
    </div>
  );
}

// ─── Fare Line ──────────────────────────────────────────────────────────────────

function FareLine({
  label,
  amount,
  sub,
  negative,
}: {
  label: string;
  amount: number;
  sub?: string;
  negative?: boolean;
}) {
  return (
    <div className="px-400 py-300 flex items-center justify-between">
      <div>
        <span className="text-label-small font-sans text-content-primary">{label}</span>
        {sub && <span className="text-[10px] font-mono text-content-tertiary ml-200">{sub}</span>}
      </div>
      <span className={`text-sm font-mono font-medium tabular-nums
        ${negative ? 'text-content-negative' : 'text-content-primary'}`}>
        {negative ? '−' : ''}₹{Math.abs(amount).toLocaleString('en-IN')}
      </span>
    </div>
  );
}
