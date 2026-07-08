'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CarIcon, ClockIcon, CashIcon, UserIcon } from '@/components/ds/Icon';

// Bottom tab bar — the app's primary navigation (category-standard for driver
// apps: Home / Trips / Earnings / Account, one thumb, zero hunting).
// Hidden during an active trip: the trip flow owns the bottom sheet then.
const TABS = [
  { label: 'Home', href: '/driver', icon: CarIcon, match: /^\/driver\/?$/ },
  { label: 'Trips', href: '/driver/trips', icon: ClockIcon, match: /^\/driver\/trips/ },
  { label: 'Earnings', href: '/driver/earnings', icon: CashIcon, match: /^\/driver\/earnings/ },
  { label: 'Account', href: '/driver-account/profile', icon: UserIcon, match: /^\/driver-account/ },
] as const;

export function TabBar() {
  const pathname = usePathname() || '';

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 bg-background-primary border-t border-border-opaque
        pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match.test(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 h-14 min-w-[44px] transition-base
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                  active ? 'text-forest-400' : 'text-content-tertiary hover:text-content-secondary'
                }`}
            >
              <Icon size={22} className={active ? 'text-forest-400' : undefined} />
              <span className={`text-label-small ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
