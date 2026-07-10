'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import { TabBarRedesign } from '@/components/TabBarRedesign';
import { EarningsScreen } from '@/components/earnings';
import { getDriverEarnings, getDriverPayouts } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

// Earn tab (redesign). Hero number per period + weekly bars + wallet/payout CTA.
// The ledger-backed detail dashboard stays at /driver-account/earnings and is
// reachable via the "Detailed breakdown" link.

const paiseToRupees = (p: number | undefined) => Math.round((p || 0) / 100);

export default function DriverEarningsTabPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [earnings, setEarnings] = useState({
    today: 0,
    todayGoal: 0, // ponytail: no daily-goal concept in the backend; section hides at 0
    todayJobs: 0,
    todayHours: 0,
    weekTotal: 0,
    weekDays: [] as { day: string; amount: number }[],
    monthTotal: 0,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [canInstantPayout, setCanInstantPayout] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.allSettled([
      getDriverEarnings(token, 'TODAY'),
      getDriverEarnings(token, 'WEEK'),
      getDriverEarnings(token, 'MONTH'),
      getDriverPayouts(token),
    ]).then(([today, week, month, payouts]) => {
      if (cancelled) return;
      setEarnings((prev) => ({
        ...prev,
        ...(today.status === 'fulfilled' && {
          today: paiseToRupees(today.value.summary.net_earnings_paise),
          todayJobs: today.value.summary.trip_count || 0,
          todayHours: today.value.summary.online_hours || 0,
        }),
        ...(week.status === 'fulfilled' && {
          weekTotal: paiseToRupees(week.value.summary.net_earnings_paise),
          weekDays: (week.value.daily_breakdown || []).map((d) => ({
            day: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
            amount: paiseToRupees(d.earnings_paise),
          })),
        }),
        ...(month.status === 'fulfilled' && {
          monthTotal: paiseToRupees(month.value.summary.net_earnings_paise),
        }),
      }));
      if (payouts.status === 'fulfilled') {
        // Payout availability mirrors the payouts page: verified bank + >= ₹100.
        setWalletBalance(paiseToRupees(payouts.value.available_balance_paise));
        setCanInstantPayout(
          !!payouts.value.bank_account?.verified &&
          (payouts.value.available_balance_paise || 0) >= 10000,
        );
      }
    });

    return () => { cancelled = true; };
  }, [token]);

  return (
    <AuthGuard allowedRole="DRIVER">
      <div className="pb-14 bg-background-primary min-h-screen">
        <EarningsScreen
          earnings={earnings}
          walletBalance={walletBalance}
          canInstantPayout={canInstantPayout}
          onInstantPayout={() => router.push('/driver-account/payouts')}
          onViewBreakdown={() => router.push('/driver-account/earnings')}
          onViewIncentives={() => router.push('/driver-account/incentives')}
        />
      </div>
      <TabBarRedesign />
    </AuthGuard>
  );
}
