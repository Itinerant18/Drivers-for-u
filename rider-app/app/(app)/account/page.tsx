"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { ordersApi } from "@/lib/api/orders";
import { FareDisplay } from "@/components/ds";
import { Shimmer } from "@/components/account/States";
import { BlurFade } from "@/components/ui/blur-fade";

import {
  CarIcon,
  BookingIcon,
  CardIcon,
  WalletIcon,
  GiftIcon,
  FlagIcon,
  LocationIcon,
  SirenIcon,
  ShieldIcon,
  NotificationIcon,
  ChatIcon,
  SettingsIcon,
  DocumentIcon,
} from "@/components/ds/Icon";

type LinkRow = { href: string; label: string; icon: React.ReactNode };

// Grouped like an inspection sheet: each panel is one concern, rows are dense.
const GROUPS: { title: string; links: LinkRow[] }[] = [
  {
    title: "Trips & car",
    links: [
      { href: "/account/garage", label: "My Garage", icon: <CarIcon size={20} /> },
      { href: "/account/bookings", label: "My Trips", icon: <BookingIcon size={20} /> },
      { href: "/account/places", label: "Saved Places", icon: <LocationIcon size={20} /> },
    ],
  },
  {
    title: "Money",
    links: [
      { href: "/account/wallet", label: "Wallet", icon: <WalletIcon size={20} /> },
      { href: "/account/payments", label: "Payments", icon: <CardIcon size={20} /> },
      { href: "/account/rewards", label: "Promos", icon: <GiftIcon size={20} /> },
      { href: "/account/refer", label: "Refer & Earn", icon: <FlagIcon size={20} /> },
    ],
  },
  {
    title: "Safety",
    links: [
      { href: "/account/emergency", label: "Emergency", icon: <SirenIcon size={20} /> },
      { href: "/account/insurance", label: "D4M Care", icon: <ShieldIcon size={20} /> },
    ],
  },
  {
    title: "App",
    links: [
      { href: "/account/notifications", label: "Notifications", icon: <NotificationIcon size={20} /> },
      { href: "/account/support", label: "Support", icon: <ChatIcon size={20} /> },
      { href: "/account/settings", label: "Settings", icon: <SettingsIcon size={20} /> },
      { href: "/account/legal", label: "Legal", icon: <DocumentIcon size={20} /> },
    ],
  },
];

function loyaltyTier(trips: number): { name: string; color: string } {
  if (trips >= 15) return { name: "Platinum", color: "text-content-accent" };
  if (trips >= 5) return { name: "Gold", color: "text-content-warning" };
  return { name: "Silver", color: "text-content-secondary" };
}

export default function AccountPage() {
  const rider = useAuthStore((s) => s.rider);
  const logout = useAuthStore((s) => s.logout);

  const [stats, setStats] = useState<{ trips: number; spent: number } | null>(null);

  useEffect(() => {
    let alive = true;
    ordersApi
      .history({ status: "COMPLETED", limit: 100 })
      .then((res) => {
        if (!alive) return;
        const spent = res.orders.reduce((acc, o) => acc + o.base_fare_paise, 0);
        setStats({ trips: res.total ?? res.orders.length, spent });
      })
      .catch(() => alive && setStats({ trips: 0, spent: 0 }));
    return () => {
      alive = false;
    };
  }, []);

  const tier = loyaltyTier(stats?.trips ?? 0);
  const initials = (rider?.name ?? "?").trim().slice(0, 1).toUpperCase();

  return (
    <main className="min-h-screen bg-background-primary pb-24">
      <div className="px-4 pt-12">
        <BlurFade delay={0.1}>
          <h1 className="mb-4 text-2xl font-bold text-content-primary">Account</h1>
        </BlurFade>

        {/* Profile — the whole card links to profile editing */}
        <BlurFade delay={0.15}>
          <Link
            href="/account/profile"
            className="flex items-center gap-4 rounded-xl bg-background-primary border border-border-opaque p-4 shadow-elevation-1 press-spring active:scale-[0.99]"
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-accent text-2xl font-bold text-content-accent">
              {rider?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rider.profile_photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-content-primary">{rider?.name ?? "Add your name"}</p>
              <p className="text-sm text-content-secondary">{rider?.phone ?? ""}</p>
            </div>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${rider?.kyc_level && rider.kyc_level !== "NONE"
                  ? "bg-surface-positive text-content-positive"
                  : "bg-surface-neutral text-content-secondary"
                }`}
            >
              {rider?.kyc_level && rider.kyc_level !== "NONE" ? "✓ KYC" : "Unverified"}
            </span>
            <span className="text-lg text-content-tertiary" aria-hidden="true">›</span>
          </Link>
        </BlurFade>

        {/* Stats — one panel, three columns, hairline dividers */}
        <BlurFade delay={0.2}>
          <div className="mt-3 grid grid-cols-3 divide-x divide-border-opaque rounded-xl bg-background-primary border border-border-opaque shadow-elevation-1">
            <div className="p-3 text-center">
              <p className="text-xs text-content-secondary">Trips</p>
              {stats ? (
                <p className="mt-1 font-mono text-lg font-bold text-content-primary tabular-nums">{stats.trips}</p>
              ) : (
                <Shimmer className="mx-auto mt-1 h-6 w-10" />
              )}
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-content-secondary">Spent</p>
              {stats ? (
                <FareDisplay amount={stats.spent} size="md" className="mt-1 block font-bold text-content-primary" />
              ) : (
                <Shimmer className="mx-auto mt-1 h-6 w-14" />
              )}
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-content-secondary">Tier</p>
              <p className={`mt-1 text-lg font-bold ${tier.color}`}>{tier.name}</p>
            </div>
          </div>
        </BlurFade>

        {/* Grouped link panels */}
        {GROUPS.map((group, gi) => (
          <BlurFade key={group.title} delay={0.25 + gi * 0.05}>
            <p className="mb-2 mt-5 px-1 text-label-medium font-semibold text-content-secondary">{group.title}</p>
            <div className="divide-y divide-border-opaque rounded-xl bg-background-primary border border-border-opaque shadow-elevation-1">
              {group.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex min-h-[52px] items-center gap-3 px-4 py-3 active:bg-background-secondary transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center">{l.icon}</span>
                  <span className="flex-1 text-sm font-medium text-content-primary">{l.label}</span>
                  <span className="text-lg leading-none text-content-tertiary" aria-hidden="true">›</span>
                </Link>
              ))}
            </div>
          </BlurFade>
        ))}

        {/* Logout */}
        <BlurFade delay={0.5}>
          <button
            onClick={logout}
            className="mt-6 w-full rounded-xl border border-border-opaque py-3.5 text-sm font-semibold text-content-negative press-spring active:scale-[0.98]"
          >
            Log Out
          </button>
        </BlurFade>
      </div>
    </main>
  );
}
