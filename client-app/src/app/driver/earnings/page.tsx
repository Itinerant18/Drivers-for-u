'use client';

import React, { useEffect, useState } from 'react';
import AuthGuard from '../../../components/AuthGuard';
import { TabBar } from '@/components/TabBar';
import EarningsDashboard from '../../driver-account/earnings/page';
import { getDriverIncentives, DriverIncentiveQuest } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { FareDisplay } from '@/components/ds';

// Quest strip — live incentive campaigns (admin driver-ops tables) with
// progress toward each reward. Renders nothing when no campaign is active.
function QuestStrip() {
  const { token } = useAuthStore();
  const [quests, setQuests] = useState<DriverIncentiveQuest[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getDriverIncentives(token)
      .then((res) => {
        if (!cancelled) setQuests(res.quests ?? []);
      })
      .catch(() => { /* strip simply doesn't render */ });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!quests.length) return null;

  return (
    <div className="space-y-2.5 mb-6">
      <span className="text-label-medium text-content-secondary block">Active quests</span>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        {quests.map((q) => {
          const pct = q.total > 0 ? Math.min(100, Math.round((q.completed / q.total) * 100)) : 0;
          return (
            <div key={q.title} className="flex-shrink-0 w-60 rounded-md bg-accent-50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-label-medium text-content-primary">{q.title}</span>
                <FareDisplay amount={q.reward * 100} size="sm" className="text-content-accent flex-shrink-0" />
              </div>
              <div className="h-1.5 rounded-pill bg-accent-100 overflow-hidden">
                <div className="h-full bg-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-label-small text-content-secondary">
                <span>{q.completed}/{q.total} trips</span>
                <span>{q.expiry}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Earnings as a first-class tab (category standard). Reuses the ledger-backed
// earnings dashboard component; the account route keeps working for deep links.
export default function DriverEarningsTabPage() {
  return (
    <AuthGuard allowedRole="DRIVER">
      <div className="min-h-screen bg-background-primary text-content-primary font-sans">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
          <QuestStrip />
          <EarningsDashboard />
        </div>
        <TabBar />
      </div>
    </AuthGuard>
  );
}
