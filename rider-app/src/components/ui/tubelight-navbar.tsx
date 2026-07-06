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
                isActive && "text-interactive-primary font-semibold scale-105"
              )}
            >
              <div className="relative flex flex-col items-center gap-1">
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -right-3 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-400 text-[9px] font-bold text-white z-10 animate-pulse">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
                <Icon active={isActive} size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10.5px] tracking-wide">{item.name}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="lamp-v1"
                  className="absolute inset-0 w-full bg-secondary/10 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 28,
                  }}
                >
                  {/* Neon top emitter border — brand blue, not charcoal (charcoal blurred reads as a smudge, not a glow) */}
                  <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-secondary rounded-t-full shadow-[0_0_12px_var(--color-secondary)]">
                    {/* Multi-layered light beam glows */}
                    <div className="absolute w-16 h-8 bg-secondary/30 rounded-full blur-md -top-3 -left-3 pointer-events-none" />
                    <div className="absolute w-10 h-6 bg-secondary/40 rounded-full blur-md -top-2 -left-0 pointer-events-none" />
                    <div className="absolute w-6 h-4 bg-secondary/50 rounded-full blur-sm -top-1 left-2 pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
