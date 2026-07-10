'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getDriverIncentives, DriverIncentivesResponse } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { IncentivesScreen } from '@/components/account/IncentivesScreen';

type Quest = React.ComponentProps<typeof IncentivesScreen>['activeQuests'][number];

export default function DriverIncentivesPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<DriverIncentivesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getDriverIncentives(token);
      setData(res);
    } catch (err) {
      console.warn('[DriverIncentives] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const quests: Quest[] = (data?.quests ?? []).map((q, idx) => ({
    id: String(idx),
    title: q.title,
    description: q.desc,
    reward: q.reward, // API reward is already rupees (no *_paise suffix)
    progress: q.total > 0 ? Math.round((q.completed / q.total) * 100) : 0,
    target: q.total,
    current: q.completed,
    unit: '', // not provided by API
    deadline: q.expiry,
    isCompleted: q.total > 0 && q.completed >= q.total,
    type: 'BONUS', // API does not classify quests; single generic bucket
  }));

  if (loading) {
    return (
      <div className="text-center text-[10px] text-content-tertiary py-12 uppercase tracking-widest animate-pulse font-mono">
        Loading incentives…
      </div>
    );
  }

  return (
    <IncentivesScreen
      activeQuests={quests.filter((q) => !q.isCompleted)}
      completedQuests={quests.filter((q) => q.isCompleted)}
      streakDays={0} // not provided by API
      currentTier="" // not provided by API
      nextTierProgress={0} // not provided by API
    />
  );
}
