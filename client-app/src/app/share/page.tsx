'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { BASE_URL } from '@/api/client';
import { UserIcon, LocationIcon, FlagIcon } from '@/components/ds/Icon';

interface TripShareView {
  status: string;
  driver_name?: string;
  driver_location?: { lat: number; lng: number };
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  eta_minutes: number;
}

const POLL_MS = 10000;

// Timeline stages in order; a stage lights up once the trip reaches it.
const STAGES: { key: string; statuses: string[] }[] = [
  { key: 'timelineBooked', statuses: ['CREATED'] },
  { key: 'timelineAssigned', statuses: ['ASSIGNED', 'EN_ROUTE_TO_PICKUP'] },
  { key: 'timelineArrived', statuses: ['ARRIVED_AT_PICKUP'] },
  { key: 'timelineStarted', statuses: ['DELIVERING', 'COMPLETED'] },
];

function stageIndex(status: string): number {
  const i = STAGES.findIndex((s) => s.statuses.includes(status));
  return i === -1 ? 0 : i;
}

// Projects lat/lng onto SVG percentage space using the bounding box of all
// known points, padded so markers never sit on the edge.
function project(view: TripShareView, lat: number, lng: number): { x: number; y: number } {
  const lats = [view.pickup_lat, view.dropoff_lat, view.driver_location?.lat].filter(
    (v): v is number => typeof v === 'number' && v !== 0,
  );
  const lngs = [view.pickup_lng, view.dropoff_lng, view.driver_location?.lng].filter(
    (v): v is number => typeof v === 'number' && v !== 0,
  );
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 0.0001);
  const spanLng = Math.max(maxLng - minLng, 0.0001);
  return {
    x: 15 + ((lng - minLng) / spanLng) * 70,
    y: 85 - ((lat - minLat) / spanLat) * 70, // north up
  };
}

function PublicShareContent() {
  const t = useTranslations('share');
  const searchParams = useSearchParams();
  const shareToken = searchParams?.get('token') || '';

  const [view, setView] = useState<TripShareView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setError('This share link is missing its token.');
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/trip-share/${encodeURIComponent(shareToken)}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          if (!cancelled) setError(res.status === 404 ? 'Trip not found.' : 'This share link has expired.');
          return;
        }
        const payload = await res.json();
        if (!cancelled) {
          setView(payload?.data ?? payload);
          setError(null);
        }
      } catch {
        if (!cancelled && !view) setError('Unable to reach the tracking service.');
      }
    };
    void load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  if (error && !view) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-mono">
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-xs font-bold uppercase text-content-negative">Live tracking unavailable</p>
          <p className="text-[10px] text-content-tertiary">{error}</p>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-content-tertiary text-xs uppercase animate-pulse">
        {t('loadingFallback')}
      </div>
    );
  }

  const activeStage = stageIndex(view.status);
  const completed = view.status === 'COMPLETED';
  const pickup = project(view, view.pickup_lat, view.pickup_lng);
  const drop = project(view, view.dropoff_lat, view.dropoff_lng);
  const driver = view.driver_location ? project(view, view.driver_location.lat, view.driver_location.lng) : null;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans flex flex-col justify-between selection:bg-white selection:text-black">

      {/* Header */}
      <header className="border-b border-border-opaque pb-4 flex justify-between items-center w-full max-w-xl mx-auto text-left">
        <div>
          <span className="bg-surface-positive/20 text-content-positive border border-positive-400 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider block w-max mb-1">
            {completed ? 'Trip completed' : t('liveBadge')}
          </span>
          <h1 className="text-sm font-bold tracking-tight text-white font-mono uppercase">{t('journeyTracker')}</h1>
        </div>
        <span className="text-[9px] font-mono text-content-tertiary uppercase font-bold">{view.status.replaceAll('_', ' ')}</span>
      </header>

      {/* Live map */}
      <main className="w-full max-w-xl mx-auto flex-grow my-6 flex flex-col gap-4 text-left">
        <div className="bg-background-primary border border-border-opaque rounded-2xl overflow-hidden relative min-h-[300px] flex flex-col justify-between">
          <div className="absolute inset-0 bg-black/60 z-0">
            <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="shareGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--border-opaque)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#shareGrid)" />

              <line
                x1={`${pickup.x}%`} y1={`${pickup.y}%`}
                x2={`${drop.x}%`} y2={`${drop.y}%`}
                stroke="var(--accent-400)" strokeWidth="3" strokeDasharray="5,5"
              />
              <circle cx={`${pickup.x}%`} cy={`${pickup.y}%`} r="6" fill="var(--positive-400)" />
              <circle cx={`${drop.x}%`} cy={`${drop.y}%`} r="6" fill="var(--negative-400)" />
              {driver && (
                <circle
                  cx={`${driver.x}%`} cy={`${driver.y}%`} r="7"
                  fill="var(--content-primary)" stroke="var(--accent-400)" strokeWidth="2"
                />
              )}
            </svg>
          </div>

          <div className="relative z-10 p-4 bg-gradient-to-b from-black to-transparent flex justify-between items-center text-[9px] font-mono font-bold text-content-tertiary">
            <span>{completed ? '—' : t('driverEta', { mins: Math.max(1, view.eta_minutes) })}</span>
            <span className="bg-surface-positive/20 text-content-positive border border-positive-400 px-2 py-0.5 rounded uppercase">
              {view.status.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="relative z-10 p-4 bg-gradient-to-t from-black to-transparent text-[9px] font-mono text-content-tertiary">
            <span>{driver ? t('telemetrySync') : 'Waiting for driver location…'}</span>
          </div>
        </div>

        {/* Driver card */}
        {view.driver_name && (
          <div className="bg-background-primary border border-border-opaque rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-background-secondary rounded-xl flex items-center justify-center text-lg">
                <UserIcon size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{view.driver_name}</h4>
                <span className="text-[9px] font-mono text-content-tertiary uppercase tracking-wider block mt-0.5">
                  Vahnly verified driver
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Route summary — sanitized view only exposes coordinates, no addresses */}
        <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-2.5 text-xs font-mono text-content-secondary">
          <div>
            <LocationIcon size={20} />{' '}
            <span className="text-content-tertiary font-bold uppercase text-[8px] block mb-0.5">{t('pickupNode')}</span>
            {view.pickup_lat.toFixed(5)}, {view.pickup_lng.toFixed(5)}
          </div>
          <div>
            <FlagIcon size={20} />{' '}
            <span className="text-content-tertiary font-bold uppercase text-[8px] block mb-0.5">{t('destination')}</span>
            {view.dropoff_lat.toFixed(5)}, {view.dropoff_lng.toFixed(5)}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-3 font-mono text-[9px]">
          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-border-opaque pb-2">
            {t('timelineTitle')}
          </h4>
          <div className="space-y-2 text-content-secondary">
            {STAGES.map((s, i) => (
              <div
                key={s.key}
                className={`flex items-center gap-2 ${i === activeStage && !completed ? 'text-white font-bold' : i <= activeStage ? 'text-content-secondary' : 'text-content-tertiary'}`}
              >
                <span>●</span>
                <span>{t(s.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="w-full max-w-xl mx-auto text-center text-[8px] font-mono text-content-tertiary select-none pt-4 border-t border-border-opaque">
        {t('footer')}
      </footer>
    </div>
  );
}

export default function PublicSharePage() {
  const t = useTranslations('share');
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center font-sans text-content-tertiary font-mono text-xs uppercase animate-pulse">
        {t('loadingFallback')}
      </div>
    }>
      <PublicShareContent />
    </Suspense>
  );
}
