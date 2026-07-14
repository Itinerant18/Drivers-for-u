'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { TabBarRedesign } from '@/components/TabBarRedesign';
import { JobsListScreen } from '@/components/jobs';
import { getDriverEarnings, getTripHistory, DriverRecentTrip, DriverTrip } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Jobs Tab (redesign) ───────────────────────────────────────────────────────
// Completed-job history sourced from the earnings endpoint, which carries
// pickup/drop shorts the raw trip-history endpoint lacks.

// Raw trip-history rows carry no addresses but include CANCELLED trips the
// earnings endpoint omits.
function historyToJobItem(t: DriverTrip) {
  const dt = t.completed_at || t.assigned_at;
  const d = dt ? new Date(dt) : null;
  return {
    id: t.id,
    status: (t.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED') as 'CANCELLED' | 'COMPLETED',
    pickup: '—',
    drop: '—',
    fare: Math.round((t.driver_payout_paise || 0) / 100),
    date: d ? d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—',
    time: d ? d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
    distanceKm: 0,
    durationMin: 0,
    riderName: '',
  };
}

function toJobItem(t: DriverRecentTrip) {
  const dt = t.completed_at ? new Date(t.completed_at) : null;
  return {
    id: t.order_id,
    status: 'COMPLETED' as 'COMPLETED' | 'CANCELLED',
    pickup: t.pickup_short || '—',
    drop: t.drop_short || '—',
    fare: Math.round((t.driver_earnings_paise || 0) / 100),
    date: dt ? dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—',
    time: dt ? dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
    distanceKm: t.distance_km || 0,
    durationMin: t.duration_minutes || 0,
    riderName: '',
  };
}

export default function DriverJobsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [jobs, setJobs] = useState<ReturnType<typeof toJobItem>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.allSettled([
      getDriverEarnings(token, 'MONTH'),
      getTripHistory(token, 50, 0),
    ])
      .then(([earnings, history]) => {
        if (cancelled) return;
        const completed = earnings.status === 'fulfilled'
          ? (earnings.value.recent_trips || []).map(toJobItem)
          : [];
        const seen = new Set(completed.map((j) => j.id));
        const rest = history.status === 'fulfilled'
          ? (history.value.trips || []).filter((t) => !seen.has(t.id)).map(historyToJobItem)
          : [];
        setJobs([...completed, ...rest]);
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <AuthGuard allowedRole="DRIVER">
      <div className="pb-14">
        <JobsListScreen
          jobs={jobs}
          isLoading={isLoading}
          onJobPress={(id) => router.push(`/driver-account/trip-history/?trip=${id}`)}
          onLoadMore={() => {}}
          hasMore={false}
        />
      </div>
      <TabBarRedesign />
    </AuthGuard>
  );
}
