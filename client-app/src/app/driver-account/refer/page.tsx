'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getDriverReferrals } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { ReferralScreen } from '@/components/account/ReferralScreen';

export default function DriverReferPage() {
  const { token } = useAuthStore();

  // No fake defaults — the screen renders from live data only.
  const [code, setCode] = useState('');
  const [stats, setStats] = useState({
    joined: 0,
    pending: 0,
    earnings: 0,
  });

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getDriverReferrals(token);
      setCode(res.code);
      setStats({
        joined: res.joined_count || 0,
        pending: res.pending_count || 0,
        earnings: Math.round((res.earnings_paise || 0) / 100),
      });
    } catch (err) {
      console.warn('[DriverRefer] fetch failed:', err);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const referralLink = typeof window !== 'undefined' ? window.location.origin : '';

  const handleShare = () => {
    const text = code ? `Join me as a Vahnly driver partner. Use my referral code ${code}.` : 'Join me as a Vahnly driver partner.';
    if (navigator.share) {
      navigator.share({ title: 'Vahnly Driver Referral', text, url: referralLink }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${referralLink}`);
      useToastStore.getState().show('Referral link copied to clipboard.', 'success');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <ReferralScreen
      referralCode={code}
      referralLink={referralLink}
      // No per-referral reward amount in the API yet — honest zero.
      rewardPerReferral={0}
      totalReferred={stats.joined + stats.pending}
      totalEarned={stats.earnings}
      // API returns aggregate stats only, no per-referral list.
      referrals={[]}
      onShare={handleShare}
      onCopyCode={handleCopyCode}
    />
  );
}
