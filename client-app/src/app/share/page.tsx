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
      <div className="min-h-screen bg-background-primary text-content-primary flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-heading-small text-content-negative">Live tracking unavailable</p>
          <p className="text-paragraph-small text-content-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center font-sans text-paragraph-small text-content-tertiary animate-pulse">
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
    <div className="min-h-screen bg-background-primary text-content-primary p-4 sm:p-8 font-sans flex flex-col justify-between">

      {/* Header */}
      <header className="border-b border-border-opaque pb-4 flex justify-between items-end w-full max-w-xl mx-auto text-left">
        <div>
          <span className={`badge ${completed ? 'badge-neutral' : 'badge-positive'} mb-1.5`}>
            {completed ? 'Trip completed' : t('liveBadge')}
          </span>
          <h1 className="text-display-serif text-[24px]">{t('journeyTracker')}</h1>
        </div>
        <span className="text-label-small text-content-tertiary pb-1">{view.status.replaceAll('_', ' ')}</span>
      </header>

      {/* Live map */}
      <main className="w-full max-w-xl mx-auto flex-grow my-6 flex flex-col gap-4 text-left">
        <div className="card p-0 overflow-hidden relative min-h-[300px] flex flex-col justify-between">
          <div className="absolute inset-0 bg-background-secondary z-0">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="shareGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--border-opaque)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#shareGrid)" />

              <line
                x1={`${pickup.x}%`} y1={`${pickup.y}%`}
                x2={`${drop.x}%`} y2={`${drop.y}%`}
                stroke="var(--forest-400)" strokeWidth="3" strokeDasharray="5,5"
              />
              <circle cx={`${pickup.x}%`} cy={`${pickup.y}%`} r="6" fill="var(--accent-500)" />
              <circle cx={`${drop.x}%`} cy={`${drop.y}%`} r="6" fill="var(--negative-400)" />
              {driver && (
                <circle
                  cx={`${driver.x}%`} cy={`${driver.y}%`} r="7"
                  fill="var(--forest-400)" stroke="var(--gray-0)" strokeWidth="2"
                />
              )}
            </svg>
          </div>

          <div className="relative z-10 p-4 flex justify-between items-center text-label-small text-content-secondary">
            <span>{completed ? '—' : t('driverEta', { mins: Math.max(1, view.eta_minutes) })}</span>
            <span className="badge badge-positive">{view.status.replaceAll('_', ' ')}</span>
          </div>

          <div className="relative z-10 p-4 text-label-small text-content-tertiary">
            <span>{driver ? t('telemetrySync') : 'Waiting for driver location…'}</span>
          </div>
        </div>

        {/* Driver card */}
        {view.driver_name && (
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-accent-50 rounded-pill flex items-center justify-center text-content-accent">
                <UserIcon size={20} />
              </div>
              <div>
                <h4 className="text-label-large">{view.driver_name}</h4>
                <span className="text-label-small text-content-secondary block mt-0.5">
                  Vahnly verified driver
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Route summary — sanitized view only exposes coordinates, no addresses */}
        <div className="card space-y-3 text-paragraph-medium text-content-secondary">
          <div className="flex items-start gap-2.5">
            <LocationIcon size={18} />
            <div>
              <span className="text-label-small text-content-tertiary block mb-0.5">{t('pickupNode')}</span>
              <span className="font-mono text-mono-small text-content-primary">
                {view.pickup_lat.toFixed(5)}, {view.pickup_lng.toFixed(5)}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <FlagIcon size={18} />
            <div>
              <span className="text-label-small text-content-tertiary block mb-0.5">{t('destination')}</span>
              <span className="font-mono text-mono-small text-content-primary">
                {view.dropoff_lat.toFixed(5)}, {view.dropoff_lng.toFixed(5)}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card space-y-3">
          <h4 className="text-label-medium text-content-secondary border-b border-border-opaque pb-2">
            {t('timelineTitle')}
          </h4>
          <div className="space-y-2.5">
            {STAGES.map((s, i) => (
              <div
                key={s.key}
                className={`flex items-center gap-2.5 text-paragraph-small ${
                  i === activeStage && !completed
                    ? 'text-content-primary font-semibold'
                    : i <= activeStage
                      ? 'text-content-secondary'
                      : 'text-content-tertiary'
                }`}
              >
                <span className={`status-dot ${i <= activeStage ? 'status-dot-active' : 'status-dot-offline'}`} />
                <span>{t(s.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="w-full max-w-xl mx-auto text-center text-label-small text-content-tertiary select-none pt-4 border-t border-border-opaque">
        {t('footer')}
      </footer>
    </div>
  );
}

export default function PublicSharePage() {
  const t = useTranslations('share');
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-primary flex items-center justify-center font-sans text-paragraph-small text-content-tertiary animate-pulse">
        {t('loadingFallback')}
      </div>
    }>
      <PublicShareContent />
    </Suspense>
  );
}
