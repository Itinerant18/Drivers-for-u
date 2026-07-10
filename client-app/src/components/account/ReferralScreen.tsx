'use client';

import React, { useState } from 'react';

// ─── Refer a Friend Screen ─────────────────────────────────────────────────────
// Referral code display + share actions + referral stats.

interface ReferralScreenProps {
  referralCode: string;
  referralLink: string;
  rewardPerReferral: number;
  totalReferred: number;
  totalEarned: number;
  referrals: { name: string; status: 'PENDING' | 'COMPLETED'; date: string }[];
  onShare: () => void;
  onCopyCode: () => void;
}

export function ReferralScreen({
  referralCode,
  referralLink,
  rewardPerReferral,
  totalReferred,
  totalEarned,
  referrals,
  onShare,
  onCopyCode,
}: ReferralScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-primary overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-500 pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        border-b border-border-opaque">
        <h1 className="text-xl font-sans font-bold text-content-primary">Refer a Friend</h1>
      </div>

      <div className="px-500 py-500 space-y-500">
        {/* Hero banner */}
        <div className="rounded-sm bg-accent-50 border border-accent-200 p-500 text-center">
          <div className="w-14 h-14 mx-auto mb-300 rounded-full bg-accent-400
            flex items-center justify-center text-gray-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-lg font-sans font-bold text-content-primary mb-200">
            {rewardPerReferral > 0 ? `Earn ₹${rewardPerReferral} per referral` : 'Refer drivers, earn rewards'}
          </h2>
          <p className="text-[12px] font-sans text-content-secondary">
            Share your code with other drivers. You both earn when they complete 10 jobs.
          </p>
        </div>

        {/* Referral Code */}
        <div className="rounded-sm border-2 border-dashed border-accent-400 p-400 text-center">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-200">
            Your referral code
          </span>
          <span className="text-2xl font-mono font-bold text-accent-600 block tracking-widest mb-300">
            {referralCode}
          </span>
          <div className="flex gap-300">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 h-10 rounded-sm border border-accent-400
                text-label-small font-sans font-semibold text-accent-600
                hover:bg-accent-50 active:scale-95 transition-base cursor-pointer"
            >
              {copied ? '✓ Copied!' : 'Copy code'}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="flex-1 h-10 rounded-sm bg-accent-400 hover:bg-accent-500
                text-gray-0 text-label-small font-sans font-bold
                active:scale-95 transition-base cursor-pointer"
            >
              Share link
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-300">
          <div className="rounded-sm border border-border-opaque p-400 text-center">
            <span className="text-xl font-mono font-bold text-content-primary block">{totalReferred}</span>
            <span className="text-[9px] font-mono text-content-tertiary uppercase">Referred</span>
          </div>
          <div className="rounded-sm border border-border-opaque p-400 text-center">
            <span className="text-xl font-mono font-bold text-accent-600 block">₹{totalEarned.toLocaleString('en-IN')}</span>
            <span className="text-[9px] font-mono text-content-tertiary uppercase">Earned</span>
          </div>
        </div>

        {/* Referral list */}
        {referrals.length > 0 && (
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-300">
              Your referrals
            </span>
            <div className="space-y-200">
              {referrals.map((ref, i) => (
                <div key={i} className="flex items-center justify-between px-400 py-300
                  rounded-sm border border-border-opaque">
                  <div>
                    <span className="text-label-small font-sans font-medium text-content-primary block">
                      {ref.name}
                    </span>
                    <span className="text-[10px] font-mono text-content-tertiary">{ref.date}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold
                    ${ref.status === 'COMPLETED' ? 'text-content-positive' : 'text-content-warning'}`}>
                    {ref.status === 'COMPLETED' ? `+₹${rewardPerReferral}` : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
