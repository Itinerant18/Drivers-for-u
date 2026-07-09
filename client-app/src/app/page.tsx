'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { CarIcon, ShieldIcon, LocationIcon } from '@/components/ds/Icon';

export default function Home() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // client-app serves drivers only; route authenticated users to the driver app.
    if (token && isAuthenticated) {
      router.push('/driver');
    }
  }, [token, isAuthenticated, router]);

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-primary text-content-primary">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-border-opaque border-t-forest-400 animate-spin mx-auto" />
          <p className="text-label-small text-content-secondary">Initializing...</p>
        </div>
      </main>
    );
  }

  // If already logged in, do not render landing page to prevent layout shifts
  if (token && isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-primary text-content-primary">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-border-opaque border-t-forest-400 animate-spin mx-auto" />
          <p className="text-label-small text-content-secondary">Redirecting...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-6 bg-background-primary text-content-primary font-sans overflow-x-hidden selection:bg-accent-400 selection:text-content-primary">
      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex justify-between items-center py-4 border-b border-border-opaque">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-interactive-primary text-interactive-primary-text flex items-center justify-center font-bold text-lg">
            V
          </span>
          <span className="font-extrabold tracking-tight font-move text-lg text-content-primary">
            VAHNLY
          </span>
        </div>

        <Link
          href="/login/"
          className="flex items-center justify-center h-10 px-5 rounded-lg border border-border-opaque text-content-primary hover:bg-background-secondary transition-all duration-200 text-sm font-semibold cursor-pointer"
        >
          Sign In
        </Link>
      </header>

      {/* Main Core Landing Details */}
      <main className="relative z-10 w-full max-w-4xl mx-auto py-12 md:py-20 flex-grow flex flex-col justify-center gap-12 text-center md:text-left">
        <div className="space-y-6 max-w-2xl animate-enter-up">
          <span className="inline-flex items-center gap-1.5 text-label-small text-content-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
            Unified Match & Dispatch Ecosystem
          </span>

          <h1 className="text-display-serif text-4xl md:text-5xl text-content-primary leading-tight">
            Professional Dispatch <br />
            Matching Platform
          </h1>

          <p className="text-content-secondary text-sm md:text-base leading-relaxed">
            Vahnly runs a secure, high-performance dynamic ride dispatch匹配 matching ecosystem.
            Our platform allows registered independent professional drivers to connect with booking requests
            across supported metropolitan regions, optimizing route navigation and transaction routing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Link
              href="/login/"
              className="flex items-center justify-center h-12 px-8 rounded-lg bg-interactive-primary text-interactive-primary-text font-semibold hover:bg-interactive-hover transition-all shadow-elevation-1 hover:-translate-y-0.5"
            >
              Sign In to App
            </Link>
            <a
              href="#features"
              className="flex items-center justify-center h-12 px-8 rounded-lg border border-border-opaque text-content-primary font-semibold hover:bg-background-secondary transition-all"
            >
              System Features
            </a>
          </div>
        </div>

        {/* Features / Purpose Outline Grid */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-border-opaque">
          <div className="card space-y-3">
            <div className="h-10 w-10 rounded-lg bg-accent-50 text-content-accent flex items-center justify-center font-bold text-lg mb-2">
              <CarIcon size={24} />
            </div>
            <h3 className="font-bold text-content-primary text-base">Match Optimizer</h3>
            <p className="text-content-secondary text-xs leading-relaxed">
              Dynamically matches booking dispatches utilizing pre-built contraction hierarchy models and surge rates.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="h-10 w-10 rounded-lg bg-accent-50 text-content-accent flex items-center justify-center font-bold text-lg mb-2">
              <ShieldIcon size={24} />
            </div>
            <h3 className="font-bold text-content-primary text-base">MFA Gateways</h3>
            <p className="text-content-secondary text-xs leading-relaxed">
              Integrates secure federated Google logins and phone number OTP verification to maintain account integrity.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="h-10 w-10 rounded-lg bg-accent-50 text-content-accent flex items-center justify-center font-bold text-lg mb-2">
              <LocationIcon size={24} />
            </div>
            <h3 className="font-bold text-content-primary text-base">Telemetry Hubs</h3>
            <p className="text-content-secondary text-xs leading-relaxed">
              Monitors spatial coordinates and telemetry for Kolkata and Bengaluru sharded regional dispatch boundaries.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border-opaque bg-background-primary py-6 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-label-small text-content-tertiary">
          <div className="flex items-center gap-4">
            <Link href="/privacy/" className="hover:text-content-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border-opaque">|</span>
            <Link href="/terms/" className="hover:text-content-primary transition-colors">
              Terms of Service
            </Link>
          </div>
          <div>
            <span>Vahnly © 2026. Support Contact: </span>
            <a href="mailto:karmakaraniket018@gmail.com" className="hover:text-content-primary underline">
              karmakaraniket018@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
