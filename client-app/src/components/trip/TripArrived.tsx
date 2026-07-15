'use client';

import React, { useEffect, useState } from 'react';
import { SosFloatingButton } from '@/components/SosFloatingButton';

// ─── Trip Arrived at Pickup ────────────────────────────────────────────────────
// Driver has reached the pickup. Now waiting for rider to hand over the car.
// Key elements:
// - Auto-incrementing wait timer (billable after threshold)
// - OTP verification input (rider gives code)
// - Quick message presets (common comms)
// - Cancel option (with penalty warning)

interface TripArrivedProps {
  riderName: string;
  riderRating: number;
  pickupAddress: string;
  vehicleInfo: string;
  vehiclePlate: string;
  waitStartedAt: number; // Unix ms
  freeWaitMinutes: number; // e.g. 5
  otpLength?: number;
  onVerifyOtp: (otp: string) => void;
  onStartJob: () => void;
  onCall: () => void;
  onChat: () => void;
  onSendQuickMessage: (msg: string) => void;
  onCancel: () => void;
}

const QUICK_MESSAGES = [
  'I have arrived at the pickup',
  'Please share the car keys',
  'Where should I find the car?',
  'I am at the gate',
  'Running slightly late',
] as const;

export function TripArrived({
  riderName,
  riderRating,
  pickupAddress,
  vehicleInfo,
  vehiclePlate,
  waitStartedAt,
  freeWaitMinutes = 5,
  otpLength = 4,
  onVerifyOtp,
  onStartJob,
  onCall,
  onChat,
  onSendQuickMessage,
  onCancel,
}: TripArrivedProps) {
  const [waitElapsed, setWaitElapsed] = useState(0);
  const [otp, setOtp] = useState('');

  // Wait timer (updates every second)
  useEffect(() => {
    const tick = () => {
      // 0 = anchor not captured yet (parent sets it in an effect) — show 0:00, not epoch-elapsed.
      const elapsed = waitStartedAt ? Math.max(0, Math.floor((Date.now() - waitStartedAt) / 1000)) : 0;
      setWaitElapsed(elapsed);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [waitStartedAt]);

  const waitMins = Math.floor(waitElapsed / 60);
  const waitSecs = waitElapsed % 60;
  const isBillable = waitMins >= freeWaitMinutes;

  const handleOtpChange = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, otpLength);
    setOtp(clean);
    if (clean.length === otpLength) {
      onVerifyOtp(clean);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-accent-400 text-gray-0 px-500
        pt-[calc(var(--space-400)+env(safe-area-inset-top,0px))] pb-400
        flex items-center justify-between">
        <span className="flex items-center gap-300 text-label-small font-sans font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Arrived at pickup
        </span>
        <span className="text-[11px] font-mono font-medium opacity-85">
          Waiting for rider
        </span>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-500 py-400 space-y-400">
        {/* Wait Timer */}
        <div className={`rounded-sm p-400 flex items-center justify-between border-l-2
          ${isBillable
            ? 'bg-warning-50 border-warning-400'
            : 'bg-gray-50 border-accent-400'}`}>
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block">
              Wait time
            </span>
            <span className={`text-2xl font-mono font-bold tabular-nums block
              ${isBillable ? 'text-content-warning' : 'text-content-primary'}`}>
              {waitMins}:{waitSecs.toString().padStart(2, '0')}
            </span>
          </div>
          {isBillable && (
            <span className="bg-warning-50 border border-warning-400 rounded-pill px-300 py-100
              text-[10px] font-mono font-bold text-content-warning uppercase">
              Billable
            </span>
          )}
          {!isBillable && (
            <span className="text-[10px] font-mono text-content-tertiary">
              Free for {freeWaitMinutes - waitMins} more min
            </span>
          )}
        </div>

        {/* Pickup + Vehicle info */}
        <div className="rounded-sm border border-border-opaque p-400 space-y-300">
          <div className="flex items-start gap-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-500 flex-shrink-0 mt-0.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="text-label-medium font-sans font-semibold text-content-primary">
              {pickupAddress}
            </span>
          </div>
          <div className="flex items-center gap-200 text-[11px] font-mono text-content-secondary pl-7">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-content-tertiary">
              <path d="M5 17h14M7 11l1.5-4h7L17 11M6 17V11h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {[vehicleInfo, vehiclePlate].filter(Boolean).join(' · ')}
          </div>
        </div>

        {/* OTP Verification */}
        <div className="rounded-sm bg-accent-50 border border-accent-200 p-400 space-y-300">
          <span className="text-label-small font-sans font-semibold text-content-primary block">
            Enter rider&apos;s OTP to start job
          </span>
          <div className="flex gap-200 justify-center">
            {Array.from({ length: otpLength }).map((_, i) => (
              <div
                key={i}
                className={`w-11 h-12 rounded-sm border-2 flex items-center justify-center
                  text-xl font-mono font-bold
                  ${otp[i]
                    ? 'border-accent-400 bg-background-primary text-content-primary'
                    : 'border-border-opaque bg-gray-50 text-content-tertiary'}`}
              >
                {otp[i] || '·'}
              </div>
            ))}
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            className="sr-only"
            autoFocus
            aria-label="OTP input"
          />
          {/* Visible input for tap */}
          <input
            type="tel"
            inputMode="numeric"
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            placeholder="Enter 4-digit code"
            className="w-full h-11 rounded-sm border border-border-opaque px-400
              text-center font-mono text-lg tracking-[0.5em]
              bg-background-primary text-content-primary
              focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400"
          />
        </div>

        {/* Rider strip */}
        <div className="flex items-center gap-300 py-200">
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
          <button type="button" onClick={onCall} aria-label="Call"
            className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-500 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.08 5.18 2 2 0 015.08 3h3a2 2 0 012 1.72c.13 1 .36 1.97.7 2.9a2 2 0 01-.45 2.11L9.09 11a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.34 1.9.57 2.9.7a2 2 0 011.72 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" onClick={onChat} aria-label="Chat"
            className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-500 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Quick Messages */}
        <div className="space-y-200">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary">
            Quick messages
          </span>
          <div className="flex flex-wrap gap-200">
            {QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                type="button"
                onClick={() => onSendQuickMessage(msg)}
                className="px-300 py-200 rounded-pill border border-border-opaque
                  text-[11px] font-sans text-content-secondary
                  hover:bg-gray-50 active:bg-gray-100 transition-base cursor-pointer"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Actions ── */}
      <div className="flex-shrink-0 px-500 pb-[calc(var(--space-400)+env(safe-area-inset-bottom,0px))] space-y-300">
        <button
          type="button"
          onClick={onStartJob}
          disabled={otp.length < otpLength}
          className="w-full h-14 rounded-sm bg-accent-400 hover:bg-accent-500
            active:scale-[0.98] text-gray-0 font-sans font-bold text-base
            flex items-center justify-center gap-300
            shadow-elevation-1 transition-base cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          START JOB
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full h-9 text-[12px] font-sans text-content-tertiary
            hover:text-content-negative transition-base cursor-pointer"
        >
          Cancel job (penalty may apply)
        </button>
      </div>

      <SosFloatingButton />
    </div>
  );
}
