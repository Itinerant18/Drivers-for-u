'use client';

import React from 'react';
import AuthGuard from '../../../components/AuthGuard';
import { TabBar } from '@/components/TabBar';
import EarningsDashboard from '../../driver-account/earnings/page';

// Earnings as a first-class tab (category standard). Reuses the ledger-backed
// earnings dashboard component; the account route keeps working for deep links.
export default function DriverEarningsTabPage() {
  return (
    <AuthGuard allowedRole="DRIVER">
      <div className="min-h-screen bg-background-primary text-content-primary font-sans">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
          <EarningsDashboard />
        </div>
        <TabBar />
      </div>
    </AuthGuard>
  );
}
