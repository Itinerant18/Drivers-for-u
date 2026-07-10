'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/components/ds/redesign';

// ─── Performance Analytics Screen ──────────────────────────────────────────────
// Shows the driver their key metrics with trends.
// Acceptance rate, completion rate, avg rating, on-time %, peak hours.

type Period = 'WEEK' | 'MONTH' | 'ALL';

interface PerformanceScreenProps {
  metrics: {
    acceptanceRate: number;
    acceptanceTrend: number; // + or - vs last period
    completionRate: number;
    completionTrend: number;
    avgRating: number;
    ratingTrend: number;
    onTimePercent: number;
    totalJobs: number;
    totalEarnings: number;
    avgPerJob: number;
    peakHours: string; // e.g. "8-10 AM, 5-8 PM"
    topAreas: string[];
  };
  weeklyData: { day: string; jobs: number; earnings: number }[];
}

export function PerformanceScreen({ metrics, weeklyData }: PerformanceScreenProps) {
  const [period, setPeriod] = useState<Period>('WEEK');

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-secondary overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-background-primary px-500
        pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        border-b border-border-opaque">
        <h1 className="text-xl font-sans font-bold text-content-primary mb-300">Performance</h1>
        <div className="flex gap-200">
          {(['WEEK', 'MONTH', 'ALL'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`flex-1 h-8 rounded-pill text-[10px] font-mono font-semibold
                uppercase tracking-wider transition-base cursor-pointer
                ${period === p
                  ? 'bg-forest-400 text-gray-0'
                  : 'bg-gray-50 border border-border-opaque text-content-secondary'
                }`}
            >
              {p === 'WEEK' ? '7 days' : p === 'MONTH' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metrics Grid ── */}
      <div className="px-500 py-400 space-y-400">
        {/* Key metrics (2×2) */}
        <div className="grid grid-cols-2 gap-300">
          <MetricCard
            value={`${metrics.acceptanceRate}%`}
            label="Acceptance"
            trend={metrics.acceptanceTrend}
            target={85}
            current={metrics.acceptanceRate}
          />
          <MetricCard
            value={`${metrics.completionRate}%`}
            label="Completion"
            trend={metrics.completionTrend}
            target={95}
            current={metrics.completionRate}
          />
          <MetricCard
            value={`★ ${metrics.avgRating.toFixed(2)}`}
            label="Avg rating"
            trend={metrics.ratingTrend}
          />
          <MetricCard
            value={`${metrics.onTimePercent}%`}
            label="On-time"
            trend={0}
            target={90}
            current={metrics.onTimePercent}
          />
        </div>

        {/* Summary stats */}
        <div className="rounded-sm border border-border-opaque bg-background-primary p-400">
          <SectionHeader title="Summary" />
          <div className="grid grid-cols-3 gap-300 mt-200">
            <div className="text-center">
              <span className="text-lg font-mono font-bold text-content-primary block tabular-nums">
                {metrics.totalJobs}
              </span>
              <span className="text-[9px] font-mono text-content-tertiary uppercase">Jobs</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-mono font-bold text-content-primary block tabular-nums">
                ₹{metrics.totalEarnings.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] font-mono text-content-tertiary uppercase">Earned</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-mono font-bold text-content-primary block tabular-nums">
                ₹{metrics.avgPerJob}
              </span>
              <span className="text-[9px] font-mono text-content-tertiary uppercase">Per job</span>
            </div>
          </div>
        </div>

        {/* Peak hours + top areas */}
        <div className="rounded-sm border border-border-opaque bg-background-primary p-400 space-y-300">
          <SectionHeader title="Insights" />
          <div className="flex items-center gap-300 py-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-warning-400">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <span className="text-label-small font-sans font-semibold text-content-primary block">Peak hours</span>
              <span className="text-[11px] font-sans text-content-secondary">{metrics.peakHours}</span>
            </div>
          </div>
          <div className="flex items-start gap-300 py-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-500 mt-0.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div>
              <span className="text-label-small font-sans font-semibold text-content-primary block">Top areas</span>
              <span className="text-[11px] font-sans text-content-secondary">
                {metrics.topAreas.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Metric Card ────────────────────────────────────────────────────────────────

function MetricCard({
  value,
  label,
  trend,
  target,
  current,
}: {
  value: string;
  label: string;
  trend: number;
  target?: number;
  current?: number;
}) {
  return (
    <div className="rounded-sm border border-border-opaque bg-background-primary p-400">
      <span className="text-lg font-mono font-bold text-content-primary block tabular-nums">
        {value}
      </span>
      <div className="flex items-center justify-between mt-200">
        <span className="text-[9px] font-mono text-content-tertiary uppercase">{label}</span>
        {trend !== 0 && (
          <span className={`text-[9px] font-mono font-bold
            ${trend > 0 ? 'text-content-positive' : 'text-content-negative'}`}>
            {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      {/* Mini progress bar toward target */}
      {target && current !== undefined && (
        <div className="mt-200 h-1 w-full rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-[width] duration-500
              ${current >= target ? 'bg-positive-400' : current >= target * 0.8 ? 'bg-warning-400' : 'bg-negative-400'}`}
            style={{ width: `${Math.min(100, (current / target) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
