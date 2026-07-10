'use client';

import React from 'react';

// ─── Profile / Account Screen ("Me" tab) ───────────────────────────────────────
// Hub for all account management. Clean list of navigation items.
// Header: avatar, name, rating, hub badge
// Menu sections: Performance, Vehicle, Payments, Support, Settings

interface ProfileScreenProps {
  driver: {
    name: string;
    phone: string;
    email?: string;
    rating: number;
    totalJobs: number;
    hub: string;
    memberSince: string;
    profileImage?: string;
  };
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export function ProfileScreen({ driver, onNavigate, onLogout }: ProfileScreenProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-secondary overflow-y-auto">
      {/* ── Profile Header ── */}
      <div className="bg-background-primary px-500 pt-[calc(var(--space-600)+env(safe-area-inset-top,0px))] pb-500">
        <div className="flex items-center gap-400">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-accent-50 border-2 border-accent-200
            flex items-center justify-center flex-shrink-0 overflow-hidden">
            {driver.profileImage ? (
              <img src={driver.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-serif font-semibold text-accent-500">
                {driver.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-sans font-bold text-content-primary truncate">
              {driver.name}
            </h1>
            <div className="flex items-center gap-200 mt-100">
              <span className="text-[11px] font-mono text-content-warning font-semibold">★ {driver.rating.toFixed(2)}</span>
              <span className="text-content-tertiary">·</span>
              <span className="text-[11px] font-mono text-content-secondary">{driver.totalJobs} jobs</span>
              <span className="text-content-tertiary">·</span>
              <span className="px-200 py-100 rounded-sm bg-accent-50 text-[9px] font-mono font-bold text-accent-600 uppercase">
                {driver.hub}
              </span>
            </div>
            <span className="text-[10px] font-mono text-content-tertiary mt-100 block">
              Since {driver.memberSince}
            </span>
          </div>
          {/* Edit */}
          <button
            type="button"
            onClick={() => onNavigate('/driver-account/edit-profile')}
            className="w-9 h-9 rounded-full bg-gray-50 border border-border-opaque
              flex items-center justify-center text-content-secondary
              hover:bg-gray-100 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Menu Sections ── */}
      <div className="px-500 py-400 space-y-400">
        {/* Performance */}
        <MenuSection title="Performance">
          <MenuItem icon="chart" label="Performance Analytics" route="/driver-account/performance" onNavigate={onNavigate} />
          <MenuItem icon="star" label="Ratings & Reviews" route="/driver-account/ratings" onNavigate={onNavigate} />
          <MenuItem icon="trophy" label="Incentives & Quests" route="/driver-account/incentives" onNavigate={onNavigate} />
        </MenuSection>

        {/* Vehicle */}
        <MenuSection title="Vehicle">
          <MenuItem icon="car" label="Vehicle Records" route="/driver-account/vehicles" onNavigate={onNavigate} />
          <MenuItem icon="doc" label="Documents" route="/driver-account/documents" onNavigate={onNavigate} />
        </MenuSection>

        {/* Payments */}
        <MenuSection title="Payments">
          <MenuItem icon="wallet" label="Wallet & Payouts" route="/driver-account/wallet" onNavigate={onNavigate} />
          <MenuItem icon="history" label="Transaction History" route="/driver-account/transactions" onNavigate={onNavigate} />
        </MenuSection>

        {/* Support & Info */}
        <MenuSection title="Support">
          <MenuItem icon="help" label="Help & Support" route="/driver-account/support" onNavigate={onNavigate} />
          <MenuItem icon="book" label="Training Academy" route="/driver-account/training" onNavigate={onNavigate} />
          <MenuItem icon="gift" label="Refer a Friend" route="/driver-account/referral" onNavigate={onNavigate} />
        </MenuSection>

        {/* Settings */}
        <MenuSection title="Settings">
          <MenuItem icon="bell" label="Notifications" route="/driver-account/notifications" onNavigate={onNavigate} />
          <MenuItem icon="gear" label="App Settings" route="/driver-account/settings" onNavigate={onNavigate} />
        </MenuSection>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full h-11 rounded-sm border border-negative-400 bg-negative-50
            text-content-negative font-sans font-semibold text-label-medium
            hover:bg-negative-100 active:scale-[0.98] transition-base cursor-pointer mt-400"
        >
          Log out
        </button>

        {/* Version */}
        <p className="text-center text-[10px] font-mono text-content-tertiary py-300">
          Vahnly Driver v2.0.0 · Build 2026.07
        </p>
      </div>
    </div>
  );
}

// ─── Menu Section ──────────────────────────────────────────────────────────────

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-200 px-100">
        {title}
      </span>
      <div className="rounded-sm border border-border-opaque bg-background-primary divide-y divide-border-opaque overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─── Menu Item ─────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ReactNode> = {
  chart: <path d="M3 3v18h18M7 16l4-4 4 4 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  star: <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  trophy: <><path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" /><path d="M6 3h12v6a6 6 0 11-12 0V3zM12 15v3M8 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
  car: <><path d="M5 17h14M7 11l1.5-4h7L17 11M6 17V11h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="15.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/></>,
  doc: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" /><path d="M14 2v6h6M10 13h4M10 17h4M8 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
  wallet: <><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M16 14h.01M2 10h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
  history: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
  help: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M9 9a3 3 0 115 3c0 2-3 2-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" stroke="currentColor" strokeWidth="1.5" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /><path d="M12 8v13M3 12h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" stroke="currentColor" strokeWidth="1.5" /><path d="M7.5 8c.8-2.5 2.5-4 4.5-4 1 0 2 .5 2.5 1.5S15.5 8 12 8M16.5 8c-.8-2.5-2.5-4-4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
  gear: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" stroke="currentColor" strokeWidth="1.5" /></>,
};

function MenuItem({ icon, label, route, onNavigate }: { icon: string; label: string; route: string; onNavigate: (r: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(route)}
      className="w-full flex items-center gap-300 px-400 py-3.5 text-left
        hover:bg-gray-50 transition-base cursor-pointer"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-content-secondary flex-shrink-0">
        {ICONS[icon]}
      </svg>
      <span className="flex-1 text-label-small font-sans font-medium text-content-primary">{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-content-tertiary flex-shrink-0">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
