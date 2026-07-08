"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: React.ElementType;
  badge?: number;
}

interface TubelightNavbarProps {
  items: NavItem[];
  className?: string;
}

export function TubelightNavbar({ items, className }: TubelightNavbarProps) {
  const pathname = usePathname();

  // Find initial active tab based on current pathname
  const initialActive = items.find((item) => {
    if (item.url === "/account") {
      return pathname === "/account" || pathname.startsWith("/account/");
    }
    return pathname === item.url || pathname.startsWith(item.url + "/");
  })?.name || items[0].name;

  const [activeTab, setActiveTab] = useState(initialActive);

  // Sync active tab with pathname changes
  useEffect(() => {
    const active = items.find((item) => {
      if (item.url === "/account") {
        return pathname === "/account" || pathname.startsWith("/account/");
      }
      return pathname === item.url || pathname.startsWith(item.url + "/");
    });
    if (active) {
      setActiveTab(active.name);
    }
  }, [pathname, items]);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-6 w-full max-w-[440px] px-4 md:px-0",
        className
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex w-full items-center justify-between bg-background-primary/90 border border-border-opaque/70 backdrop-blur-2xl py-2 px-3 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 cursor-pointer transition-all duration-300 py-2.5 rounded-full",
                "text-content-secondary hover:text-content-primary hover:scale-105",
                isActive && "text-content-primary font-semibold scale-105"
              )}
            >
              <div className="relative flex flex-col items-center gap-1">
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -right-3 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-400 text-[9px] font-bold text-white z-10 animate-pulse">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
                <Icon active={isActive} />
                <span className="text-[10.5px] tracking-wide mt-1">{item.name}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="lamp-v1"
                  className="absolute inset-x-1 inset-y-0.5 -z-10 rounded-full bg-secondary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
