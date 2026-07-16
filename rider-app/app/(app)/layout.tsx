"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useAuthStore } from "@/lib/store/authStore";
import { registerRiderPushNotifications } from "@/lib/notifications";

import { TubelightNavbar } from "@/components/ui/tubelight-navbar";

import Image from "next/image";

function ImageIcon({ active, src }: { active: boolean; src: string }) {
  return (
    <div className={`relative transition-all duration-300 ${active ? "scale-110 drop-shadow-md" : "grayscale opacity-70 hover:grayscale-0 hover:opacity-100"}`}>
      <Image src={src} alt="icon" width={28} height={28} className="object-contain" unoptimized />
    </div>
  );
}

const ICONS = {
  Home: "https://img.icons8.com/3d-fluency/94/home.png",
  Trips: "https://img.icons8.com/3d-fluency/94/map-pin.png",
  Wallet: "https://img.icons8.com/3d-fluency/94/wallet.png",
  Account: "https://img.icons8.com/3d-fluency/94/user-male-circle.png",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard: no token → bounce to login. Render nothing until we've confirmed
  // a token exists, so the app shell never flashes for signed-out users.
  useEffect(() => {
    if (!token) {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, [token, router]);

  // Once authenticated, register this browser for FCM web push (idempotent; no-ops
  // when push is unsupported or permission is denied).
  useEffect(() => {
    if (!token) return;
    void registerRiderPushNotifications().catch(() => {});
  }, [token]);

  if (!authChecked) return null;

  const navItems = [
    { name: "Home", url: "/home", icon: ({ active }: { active: boolean }) => <ImageIcon active={active} src={ICONS.Home} /> },
    { name: "Trips", url: "/account/bookings", icon: ({ active }: { active: boolean }) => <ImageIcon active={active} src={ICONS.Trips} /> },
    { name: "Wallet", url: "/account/wallet", icon: ({ active }: { active: boolean }) => <ImageIcon active={active} src={ICONS.Wallet} /> },
    { name: "Account", url: "/account", icon: ({ active }: { active: boolean }) => <ImageIcon active={active} src={ICONS.Account} />, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-background-primary pb-28">
      {children}
      <TubelightNavbar items={navItems} />
    </div>
  );
}
