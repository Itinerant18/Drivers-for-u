'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDriverProfile, DriverProfile } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { ProfileScreen } from '@/components/account/ProfileScreen';

// ProfileScreen's menu links several routes that don't exist as-is; map them to
// the pages that actually carry those flows.
const ROUTE_ALIASES: Record<string, string> = {
  '/driver-account/referral': '/driver-account/refer',
  '/driver-account/ratings': '/driver-account/performance',
  '/driver-account/transactions': '/driver-account/wallet',
  '/driver-account/edit-profile': '/driver-account/documents', // bio editor lives there
};

export default function DriverProfilePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState<DriverProfile | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getDriverProfile(token)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) console.warn('[DriverProfile] Profile fetch failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '';

  return (
    <ProfileScreen
      driver={{
        name: profile?.name || user?.name || '',
        phone: profile?.phone || user?.phone || '',
        // No rating field in the API yet — honest zero, not a fabricated score.
        rating: 0,
        totalJobs: profile?.total_trips ?? 0,
        hub: profile?.city_prefix ?? '',
        memberSince,
      }}
      onNavigate={(route) => router.push(ROUTE_ALIASES[route] ?? route)}
      onLogout={() => {
        useAuthStore.getState().logout();
        window.location.href = '/login?role=driver';
      }}
    />
  );
}
