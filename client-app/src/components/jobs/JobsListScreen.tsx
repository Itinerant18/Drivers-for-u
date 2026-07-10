'use client';

import React, { useState } from 'react';

// ─── Jobs Tab (History) ────────────────────────────────────────────────────────
// Replaces "Trips" tab. Shows completed, cancelled, upcoming jobs.
// Filter chips at top: All / Completed / Cancelled / Scheduled

type JobStatus = 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' | 'IN_PROGRESS';
type FilterType = 'ALL' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED';

interface JobItem {
  id: string;
  status: JobStatus;
  pickup: string;
  drop: string;
  fare: number;
  date: string; // formatted
  time: string; // formatted
  distanceKm: number;
  durationMin: number;
  riderName: string;
}

interface JobsListScreenProps {
  jobs: JobItem[];
  isLoading: boolean;
  onJobPress: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export function JobsListScreen({
  jobs,
  isLoading,
  onJobPress,
  onLoadMore,
  hasMore,
}: JobsListScreenProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filteredJobs = filter === 'ALL'
    ? jobs
    : jobs.filter((j) => j.status === filter);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-primary">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-500 pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400">
        <h1 className="text-xl font-sans font-bold text-content-primary mb-400">Jobs</h1>

        {/* Filter chips */}
        <div className="flex gap-200 overflow-x-auto no-scrollbar">
          {(['ALL', 'COMPLETED', 'CANCELLED', 'SCHEDULED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-400 py-200 rounded-pill text-[11px] font-mono
                font-semibold uppercase tracking-wider transition-base cursor-pointer
                ${filter === f
                  ? 'bg-forest-400 text-gray-0'
                  : 'bg-gray-50 border border-border-opaque text-content-secondary hover:text-content-primary'
                }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Job List ── */}
      <div className="flex-1 overflow-y-auto px-500 pb-500 space-y-300">
        {isLoading && filteredJobs.length === 0 && (
          <div className="space-y-300">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-sm bg-gray-50 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filteredJobs.length === 0 && (
          <div className="text-center py-900">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-400 text-content-tertiary">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-label-medium font-sans text-content-secondary">No jobs found</p>
            <p className="text-[12px] font-sans text-content-tertiary mt-100">
              {filter !== 'ALL' ? 'Try a different filter' : 'Complete your first job to see it here'}
            </p>
          </div>
        )}

        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} onPress={() => onJobPress(job.id)} />
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full h-10 rounded-sm border border-border-opaque
              text-label-small font-sans font-semibold text-content-secondary
              hover:bg-gray-50 transition-base cursor-pointer"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job, onPress }: { job: JobItem; onPress: () => void }) {
  const statusConfig: Record<JobStatus, { bg: string; text: string; label: string }> = {
    COMPLETED: { bg: 'bg-positive-50', text: 'text-content-positive', label: 'Completed' },
    CANCELLED: { bg: 'bg-negative-50', text: 'text-content-negative', label: 'Cancelled' },
    SCHEDULED: { bg: 'bg-accent-50', text: 'text-accent-600', label: 'Scheduled' },
    IN_PROGRESS: { bg: 'bg-warning-50', text: 'text-content-warning', label: 'In Progress' },
  };
  const s = statusConfig[job.status];

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full text-left rounded-sm border border-border-opaque p-400
        hover:border-accent-200 hover:shadow-elevation-1 transition-base cursor-pointer
        active:scale-[0.99]"
    >
      <div className="flex items-start justify-between mb-300">
        <div className="flex-1 min-w-0">
          <span className="text-label-small font-sans font-semibold text-content-primary block truncate">
            {job.pickup}
          </span>
          <span className="text-[11px] font-sans text-content-secondary block truncate mt-100">
            → {job.drop}
          </span>
        </div>
        <span className={`flex-shrink-0 ml-300 px-200 py-100 rounded-sm text-[9px]
          font-mono font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
          {s.label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-content-tertiary">
          {job.date} · {job.time}
        </span>
        <div className="flex items-center gap-300 text-[11px] font-mono">
          <span className="text-content-secondary">{job.distanceKm.toFixed(1)} km</span>
          <span className="text-content-secondary">{job.durationMin} min</span>
          {job.status === 'COMPLETED' && (
            <span className="font-bold text-accent-600">₹{job.fare.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </button>
  );
}
