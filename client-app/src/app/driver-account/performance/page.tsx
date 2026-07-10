'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getDriverPerformance, DriverPerformanceResponse } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { PerformanceScreen } from '@/components/account/PerformanceScreen';

export default function DriverPerformancePage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<DriverPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getDriverPerformance(token);
      setData(res);
    } catch (err) {
      console.warn('[DriverPerformance] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="text-center text-[10px] text-content-tertiary py-12 uppercase tracking-widest animate-pulse font-mono">
        Loading performance…
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <PerformanceScreen
      metrics={{
        acceptanceRate: m?.acceptance ?? 0,
        acceptanceTrend: 0, // API has no trend data
        completionRate: m?.completion ?? 0,
        completionTrend: 0, // API has no trend data
        avgRating: m?.rating ?? 0,
        ratingTrend: 0, // API has no trend data
        onTimePercent: 0, // not provided by API
        totalJobs: m?.trips ?? 0,
        totalEarnings: 0, // not provided by API
        avgPerJob: 0, // not provided by API
        peakHours: '', // not provided by API
        topAreas: [], // not provided by API
      }}
      weeklyData={[]} // not provided by API (prop is currently unused by the component)
    />
  );
}
