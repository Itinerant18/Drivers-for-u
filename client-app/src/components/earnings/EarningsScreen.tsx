'use client';

import React, { useState } from 'react';

// ─── Earnings Screen (Earn Tab) ────────────────────────────────────────────────
// Today's earnings hero → weekly chart → breakdown → instant payout CTA
// Motivational: shows progress toward daily goal

type Period = 'TODAY' | 'WEEK' | 'MONTH';

interface EarningsScreenProps {
  earnings: {
    today: number;
    todayGoal: number;
    todayJobs: number;
    todayHours: number;
    weekTotal: number;
    weekDays: { day: string; amount: number }[];
    monthTotal: number;
  };
  walletBalance: number;
  canInstantPayout: boolean;
  onInstantPayout: () => void;
  onViewBreakdown: () => void;
  onViewIncentives: () => void;
}

export function EarningsScreen({
  earnings,
  walletBalance,
  canInstantPayout,
  onInstantPayout,
  onViewBreakdown,
  onViewIncentives,
}: EarningsScreenProps) {
  const [period, setPeriod] = useState<Period>('TODAY');
  const goalProgress = Math.min(100, (earnings.today / earnings.todayGoal) * 100);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-primary overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-500 pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400">
        <h1 className="text-xl font-sans font-bold text-content-primary">Earnings</h1>
      </div>

      {/* ── Period Tabs ── */}
      <div className="flex-shrink-0 flex gap-200 px-500 mb-400">
        {(['TODAY', 'WEEK', 'MONTH'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`flex-1 h-9 rounded-pill text-[10px] font-mono font-semibold
              uppercase tracking-wider transition-base cursor-pointer
              ${period === p
                ? 'bg-forest-400 text-gray-0'
                : 'bg-gray-50 border border-border-opaque text-content-secondary'
              }`}
          >
            {p === 'TODAY' ? 'Today' : p === 'WEEK' ? 'This week' : 'This month'}
          </button>
        ))}
      </div>

      {/* ── Hero Earnings Card ── */}
      <div className="mx-500 rounded-sm bg-forest-400 text-gray-0 p-500 mb-400">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider opacity-70 block mb-200">
          {period === 'TODAY' ? "Today's earnings" : period === 'WEEK' ? 'This week' : 'This month'}
        </span>
        <span className="text-[32px] font-serif font-semibold block tabular-nums leading-tight">
          ₹{(period === 'TODAY' ? earnings.today : period === 'WEEK' ? earnings.weekTotal : earnings.monthTotal).toLocaleString('en-IN')}
        </span>

        {/* Goal Progress (today only; hidden when no goal is configured) */}
        {period === 'TODAY' && earnings.todayGoal > 0 && (
          <div className="mt-400">
            <div className="flex justify-between items-center mb-200">
              <span className="text-[10px] font-mono opacity-70">Daily goal</span>
              <span className="text-[10px] font-mono font-bold">
                {goalProgress.toFixed(0)}% of ₹{earnings.todayGoal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick stats */}
        {period === 'TODAY' && (
          <div className="flex justify-between mt-400 pt-300 border-t border-white/20">
            <div>
              <span className="text-lg font-mono font-bold block">{earnings.todayJobs}</span>
              <span className="text-[9px] font-mono opacity-70 uppercase">Jobs</span>
            </div>
            <div>
              <span className="text-lg font-mono font-bold block">{earnings.todayHours.toFixed(1)}h</span>
              <span className="text-[9px] font-mono opacity-70 uppercase">Online</span>
            </div>
            <div>
              <span className="text-lg font-mono font-bold block">
                ₹{earnings.todayJobs > 0 ? Math.round(earnings.today / earnings.todayJobs) : 0}
              </span>
              <span className="text-[9px] font-mono opacity-70 uppercase">Per job</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Weekly Chart (simplified bar chart) ── */}
      {period === 'WEEK' && (
        <div className="mx-500 rounded-sm border border-border-opaque p-400 mb-400">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-300">
            Daily breakdown
          </span>
          <div className="flex items-end justify-between gap-200 h-24">
            {earnings.weekDays.map((day) => {
              const maxAmount = Math.max(...earnings.weekDays.map((d) => d.amount), 1);
              const height = Math.max(4, (day.amount / maxAmount) * 100);
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-200">
                  <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                    <div
                      className="w-full max-w-[24px] rounded-t-sm bg-accent-400 transition-all duration-300"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-content-tertiary uppercase">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Wallet + Instant Payout ── */}
      <div className="mx-500 rounded-sm border border-border-opaque p-400 mb-400
        flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block">
            Wallet balance
          </span>
          <span className="text-lg font-mono font-bold text-content-primary tabular-nums">
            ₹{walletBalance.toLocaleString('en-IN')}
          </span>
        </div>
        <button
          type="button"
          onClick={onInstantPayout}
          disabled={!canInstantPayout}
          className="px-400 py-300 rounded-sm bg-accent-400 hover:bg-accent-500
            text-gray-0 text-[11px] font-sans font-bold
            active:scale-95 transition-base cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Instant Payout
        </button>
      </div>

      {/* ── Quick Links ── */}
      <div className="mx-500 space-y-200 pb-500">
        <QuickLink label="Detailed breakdown" onClick={onViewBreakdown} />
        <QuickLink label="Incentives & quests" onClick={onViewIncentives} />
      </div>
    </div>
  );
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-400 py-300
        rounded-sm border border-border-opaque hover:bg-gray-50
        transition-base cursor-pointer"
    >
      <span className="text-label-small font-sans font-semibold text-content-primary">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-content-tertiary">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
