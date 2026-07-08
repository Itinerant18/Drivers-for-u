import React from 'react';
import Link from 'next/link';
import { DutyState, useDriverDutyStore } from '../store/useDriverDutyStore';
import { OfferPopup } from './OfferPopup';
import { DriverProfile } from '../api/client';
import { ArrivedVerificationPane } from '../app/driver/trip/live/ArrivedVerificationPane';
import { TripInProgressPane } from '../app/driver/trip/live/TripInProgressPane';
import { FareDisplay, ETADisplay, StatusBadge, PhoneIcon, ChatIcon, NavigateIcon, CheckIcon } from './ds';

// ─────────────────────────────────────────────────────────────────────────────
// DashboardHome — Duty toggle + stats
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardHomeProps {
  dutyState: DutyState;
  profile?: DriverProfile | null;
  activeVehicle: string;
  setActiveVehicle: (v: string) => void;
  preferredTripFilter: 'ALL' | 'CITY' | 'OUTSTATION';
  setPreferredTripFilter: (f: 'ALL' | 'CITY' | 'OUTSTATION') => void;
  handleToggleDutySwitch: () => Promise<void>;
  stats: {
    trips_count: number;
    earnings_rupees: number;
    online_hours: number;
    acceptance_rate: number;
    rating: number;
  };
  setDutyState: (s: DutyState) => void;
  logAudit: (e: string, m: any) => void;
}

function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  dutyState,
  profile,
  preferredTripFilter,
  setPreferredTripFilter,
  handleToggleDutySwitch,
  stats,
  logAudit,
}) => {
  const isOffline = dutyState === 'OFFLINE';
  const firstName = (profile?.name || 'Driver').split(' ')[0];

  return (
    <div className="space-y-4 text-left">

      {/* ── Greeting — the one serif display moment on this screen ── */}
      <div className="flex items-end justify-between gap-3">
        {/* suppressHydrationWarning: greeting depends on client clock; static
            export prerenders at build-time hour. */}
        <h2 className="text-display-serif text-[26px] text-content-primary" suppressHydrationWarning>
          {greetingForHour(new Date().getHours())}, {firstName}
        </h2>
        {!isOffline && (
          <span className="flex items-center gap-1.5 pb-1 flex-shrink-0" role="status">
            <span className="status-dot status-dot-online animate-ping" />
            <span className="text-label-small text-content-secondary">Seeking matches</span>
          </span>
        )}
      </div>

      {/* ── Bento: forest hero earnings tile + sage stat tiles ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Hero — today's earnings, forest-drenched */}
        <div className="col-span-2 rounded-md bg-forest-400 text-white p-5 flex items-end justify-between">
          <div>
            <span className="text-label-small text-accent-200 block mb-1.5">Today&apos;s earnings</span>
            <span className="font-mono text-[32px] leading-none font-medium tabular-nums">
              ₹{stats.earnings_rupees.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono text-mono-large tabular-nums block">{stats.trips_count}</span>
            <span className="text-label-small text-accent-200">trips</span>
          </div>
        </div>

        {/* Hours online */}
        <div className="rounded-md bg-accent-50 p-4">
          <span className="font-mono text-mono-large text-content-primary tabular-nums block">
            {stats.online_hours.toFixed(1)}h
          </span>
          <span className="text-label-small text-content-secondary">online today</span>
        </div>

        {/* Acceptance */}
        <div className="rounded-md bg-background-secondary border border-border-opaque p-4">
          <span className="font-mono text-mono-large text-content-primary tabular-nums block">
            {stats.acceptance_rate}%
          </span>
          <span className="text-label-small text-content-secondary">acceptance</span>
        </div>
      </div>

      {/* ── Capability + trip-type filter ── */}
      <div className="flex justify-between items-start rounded-md p-4 border border-border-opaque">
        <div className="min-w-0 flex-1">
          <span className="text-label-small text-content-tertiary block mb-1">
            Allowed cars
          </span>
          <span className="text-label-large text-content-primary font-medium">
            {profile?.can_drive_manual ? 'Manual & Automatic' : 'Automatic Only'}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-label-small text-content-tertiary block mb-1">
            Job type
          </span>
          <select
            value={preferredTripFilter}
            onChange={(e) => setPreferredTripFilter(e.target.value as any)}
            className="bg-transparent text-label-large text-content-primary outline-none cursor-pointer text-right"
          >
            <option value="ALL">All</option>
            <option value="CITY">City Only</option>
            <option value="OUTSTATION">Outstation Only</option>
          </select>
        </div>
      </div>

      {/* ── Duty toggle — full-width thumb-zone anchor ── */}
      {isOffline ? (
        <button
          onClick={handleToggleDutySwitch}
          type="button"
          className="w-full h-14 rounded-sm bg-interactive-primary text-interactive-primary-text
            text-label-large font-medium
            transition-base cursor-pointer animate-cta-pulse
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Go Online
        </button>
      ) : (
        <button
          onClick={handleToggleDutySwitch}
          type="button"
          className="w-full h-14 rounded-sm bg-background-primary
            border-2 border-status-online
            text-label-large font-medium text-content-negative
            transition-base cursor-pointer animate-go-online-glow
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Go Offline
        </button>
      )}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NavigationPane — En Route to Pickup
// ─────────────────────────────────────────────────────────────────────────────

interface NavigationPaneProps {
  activeTrip: any;
  currentPosition: { lat: number; lng: number } | null;
  setShowCancelModal: (show: boolean) => void;
  handleArrivedAtPickup: () => Promise<void>;
  onOpenChat?: () => void;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// City-traffic average used to turn straight-line distance into an ETA when no
// routing service is available for drivers.
const AVG_CITY_SPEED_KMH = 22;

export const NavigationPane: React.FC<NavigationPaneProps> = ({
  activeTrip,
  currentPosition,
  setShowCancelModal,
  handleArrivedAtPickup,
  onOpenChat,
}) => {
  const distanceKm =
    currentPosition && activeTrip.pickup_lat && activeTrip.pickup_lng
      ? haversineKm(currentPosition.lat, currentPosition.lng, activeTrip.pickup_lat, activeTrip.pickup_lng)
      : null;
  const etaMinutes =
    distanceKm !== null ? Math.max(1, Math.round((distanceKm / AVG_CITY_SPEED_KMH) * 60)) : null;

  return (
    <div className="space-y-4 text-left animate-enter">

      {/* ── Status header ── */}
      <div className="flex items-center justify-between">
        <StatusBadge status="active" label="Heading to pickup" />
        <div className="flex items-baseline gap-1">
          {etaMinutes !== null ? (
            <>
              <span className="text-label-small text-content-secondary">
                {distanceKm !== null ? `${distanceKm.toFixed(1)} km · arrive in` : 'Arrive in'}
              </span>
              <ETADisplay minutes={etaMinutes} />
            </>
          ) : (
            <span className="text-label-small text-content-tertiary">Acquiring GPS…</span>
          )}
        </div>
      </div>

      <div className="border-t border-border-opaque" />

      {/* ── Rider mini-card ── */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-pill bg-background-tertiary flex items-center justify-center text-heading-medium text-content-secondary flex-shrink-0">
          {activeTrip.customer_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-heading-small text-content-primary truncate">{activeTrip.customer_name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-content-warning text-label-medium">★</span>
            <span className="font-mono text-mono-small text-content-secondary tabular-nums">
              {activeTrip.customer_rating?.toFixed(2) ?? '—'}
            </span>
          </div>
        </div>
        <span className="text-label-small text-content-tertiary">+91 98XXX XXXXX</span>
      </div>

      {/* ── Pickup address ── */}
      <div className="bg-background-secondary rounded-sm p-4 border border-border-opaque">
        <span className="text-label-small text-content-tertiary block mb-1">Pickup address</span>
        <p className="text-label-large text-content-primary">{activeTrip.pickup_address}</p>
        {activeTrip.special_notes && (
          <p className="text-paragraph-small text-content-warning mt-2">
            &quot;{activeTrip.special_notes}&quot;
          </p>
        )}
      </div>

      {/* ── Action row ── */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            const p = activeTrip.customer_phone;
            if (p && p !== 'Unavailable') window.location.href = `tel:${p}`;
          }}
          className="flex flex-col items-center justify-center gap-1 h-16 bg-background-secondary rounded-sm border border-border-opaque
            text-label-small text-content-primary cursor-pointer transition-base
            hover:bg-background-tertiary active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          <PhoneIcon size={20} />
          <span>Call</span>
        </button>
        <button
          onClick={onOpenChat}
          className="flex flex-col items-center justify-center gap-1 h-16 bg-background-secondary rounded-sm border border-border-opaque
            text-label-small text-content-primary cursor-pointer transition-base
            hover:bg-background-tertiary active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          <ChatIcon size={20} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeTrip.pickup_lat},${activeTrip.pickup_lng}&travelmode=driving`, '_blank')}
          className="flex flex-col items-center justify-center gap-1 h-16 bg-accent-400 rounded-sm
            text-label-small text-white cursor-pointer transition-base
            hover:bg-accent-500 active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          <NavigateIcon size={20} />
          <span>Navigate</span>
        </button>
      </div>

      {/* ── CTAs ── */}
      <button
        onClick={handleArrivedAtPickup}
        className="w-full h-14 rounded-sm bg-interactive-primary text-interactive-primary-text
          text-label-large font-medium cursor-pointer transition-base
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <CheckIcon size={18} /> I&apos;ve Arrived
        </span>
      </button>

      <button
        type="button"
        onClick={() => setShowCancelModal(true)}
        className="w-full text-center text-label-medium text-content-negative py-3 min-h-[44px]
          cursor-pointer hover:opacity-80 transition-base
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative-400"
      >
        Cancel Allocation
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DriverTripManager — state router (unchanged interface)
// ─────────────────────────────────────────────────────────────────────────────

interface DriverTripManagerProps {
  profile?: DriverProfile | null;
  activeTrip: any;
  stats: any;
  activeVehicle: string;
  setActiveVehicle: (v: string) => void;
  preferredTripFilter: 'ALL' | 'CITY' | 'OUTSTATION';
  setPreferredTripFilter: (f: 'ALL' | 'CITY' | 'OUTSTATION') => void;
  handleToggleDutySwitch: () => Promise<void>;
  logAudit: (e: string, m: any) => void;
  currentPosition: { lat: number; lng: number } | null;
  setShowCancelModal: (show: boolean) => void;
  handleArrivedAtPickup: () => Promise<void>;
  freeWaitSeconds: number;
  setFreeWaitSeconds: (s: number) => void;
  waitingCharges: number;
  setWaitingCharges: (c: number) => void;
  otpError: string;
  setOtpError: (err: string) => void;
  startOdometer: string;
  setStartOdometer: (o: string) => void;
  startFuel: number;
  setStartFuel: (f: number) => void;
  startOdoPhoto: string | null;
  setStartOdoPhoto: (p: string | null) => void;
  otpVerificationCode: string;
  setOtpVerificationCode: (c: string) => void;
  carPlate: string;
  setCarPlate: (p: string) => void;
  setDutyState: (s: DutyState) => void;
  setActiveTrip: (t: any) => void;
  tollCharges: number;
  parkingCharges: number;
  handleTollAddition: () => void;
  handleParkingAddition: () => void;
  endOdometer: string;
  setEndOdometer: (o: string) => void;
  endFuel: number;
  setEndFuel: (f: number) => void;
  endOdoPhoto: string | null;
  setEndOdoPhoto: (p: string | null) => void;
  handleSlideToEndTrip: () => Promise<void>;
  // Expands the rider-chat panel in the bottom sheet on /driver.
  onOpenChat?: () => void;
  triggerSOS?: () => void;
}

export const DriverTripManager: React.FC<DriverTripManagerProps> = (props) => {
  const { state } = useDriverDutyStore();

  switch (state) {
    case 'OFFER_PENDING':
      return <OfferPopup />;

    case 'EN_ROUTE':
      if (!props.activeTrip) return <DashboardHome {...props} dutyState={state} />;
      return (
        <NavigationPane
          activeTrip={props.activeTrip}
          currentPosition={props.currentPosition}
          setShowCancelModal={props.setShowCancelModal}
          handleArrivedAtPickup={props.handleArrivedAtPickup}
          onOpenChat={props.onOpenChat}
        />
      );

    case 'ARRIVED':
      if (!props.activeTrip) return <DashboardHome {...props} dutyState={state} />;
      return (
        <ArrivedVerificationPane
          activeTrip={props.activeTrip}
          freeWaitSeconds={props.freeWaitSeconds}
          setFreeWaitSeconds={props.setFreeWaitSeconds}
          waitingCharges={props.waitingCharges}
          setWaitingCharges={props.setWaitingCharges}
          otpError={props.otpError}
          setOtpError={props.setOtpError}
          startOdometer={props.startOdometer}
          setStartOdometer={props.setStartOdometer}
          startFuel={props.startFuel}
          setStartFuel={props.setStartFuel}
          startOdoPhoto={props.startOdoPhoto}
          setStartOdoPhoto={props.setStartOdoPhoto}
          otpVerificationCode={props.otpVerificationCode}
          setOtpVerificationCode={props.setOtpVerificationCode}
          carPlate={props.carPlate}
          setCarPlate={props.setCarPlate}
          logAudit={props.logAudit}
          setDutyState={props.setDutyState}
          setActiveTrip={props.setActiveTrip}
        />
      );

    case 'DELIVERING':
      if (!props.activeTrip) return <DashboardHome {...props} dutyState={state} />;
      return (
        <TripInProgressPane
          activeTrip={props.activeTrip}
          tollCharges={props.tollCharges}
          parkingCharges={props.parkingCharges}
          handleTollAddition={props.handleTollAddition}
          handleParkingAddition={props.handleParkingAddition}
          endOdometer={props.endOdometer}
          setEndOdometer={props.setEndOdometer}
          endFuel={props.endFuel}
          setEndFuel={props.setEndFuel}
          startOdometer={props.startOdometer}
          endOdoPhoto={props.endOdoPhoto}
          setEndOdoPhoto={props.setEndOdoPhoto}
          handleSlideToEndTrip={props.handleSlideToEndTrip}
          triggerSOS={props.triggerSOS}
          logAudit={props.logAudit}
          onOpenChat={props.onOpenChat}
        />
      );

    case 'COMPLETED':
      if (!props.activeTrip) return <DashboardHome {...props} dutyState={state} />;
      // Settlement lives on /driver/trip/bill → /rate. Landing back here
      // mid-settlement (back button, reload) resumes that flow instead of
      // presenting a second, different payment UI.
      return (
        <div className="space-y-4 text-left animate-enter">
          <div className="flex items-center justify-between border-b border-border-opaque pb-3">
            <h3 className="text-heading-medium text-content-primary">Trip completed</h3>
            <StatusBadge status="active" label="Settlement pending" />
          </div>
          <p className="text-paragraph-small text-content-secondary">
            Confirm the payment and rate the rider to finish this trip.
          </p>
          <Link
            href={`/driver/trip/bill?order_id=${props.activeTrip.order_id}`}
            className="block w-full h-14 rounded-sm bg-interactive-primary text-interactive-primary-text
              text-label-large font-medium text-center leading-[56px] transition-base hover:opacity-90
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            Resume settlement
          </Link>
        </div>
      );

    default:
      return <DashboardHome {...props} dutyState={state} />;
  }
};
