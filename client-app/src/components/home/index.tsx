'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeOffline } from './HomeOffline';
import { HomeOnline } from './HomeOnline';
import { OfferScreen } from '@/components/OfferScreen';
import { TripEnRoute } from '@/components/trip/TripEnRoute';
import { TripArrived } from '@/components/trip/TripArrived';
import { TripDelivering } from '@/components/trip/TripDelivering';
import { TripComplete } from '@/components/trip/TripComplete';
import { useDriverStore } from '@/store/useDriverStore';
import { useDriverDutyStore } from '@/store/useDriverDutyStore';
import { useOfferStore } from '@/store/useOfferStore';
import { useTripStore } from '@/store/useTripStore';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Home Screen Orchestrator ──────────────────────────────────────────────────
// Renders the correct state based on the REAL duty-state machine
// (useDriverDutyStore.state):
//   OFFLINE → HomeOffline
//   ONLINE  → HomeOnline (seeking)
//   OFFER_PENDING → OfferScreen (full-screen takeover)
//   EN_ROUTE / ARRIVED / DELIVERING / COMPLETED → trip flow screens
//
// Trip data comes from useDriverDutyStore.activeOrder. Fields the legacy Order
// type does not carry (coords, plate, fare) render as safe fallbacks; the
// settlement flow reuses the existing /driver/trip/bill route.

export function HomeOrchestrator() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    connectionStatus,
    gpsError,
    cooldownSecs,
    tripFilter,
    stats,
    goOnline,
    goOffline,
    reconnect,
    setTripFilter,
  } = useDriverStore();

  const { state: dutyState, activeOrder, setDutyState } = useDriverDutyStore();
  const { status: offerStatus } = useOfferStore();
  const { markArrived, startTrip } = useTripStore();

  // OTP entered on the ARRIVED screen, consumed by Start Job.
  const [enteredOtp, setEnteredOtp] = useState('');

  const orderId = activeOrder?.id || '';
  const goToBill = () => router.push(`/driver/trip/bill?order_id=${orderId}`);

  // Offer takeover wins regardless of duty state (matches legacy behaviour).
  if (offerStatus === 'OFFER_PENDING' || dutyState === 'OFFER_PENDING') {
    return <OfferScreen />;
  }

  switch (dutyState) {
    case 'EN_ROUTE':
      if (!activeOrder) break;
      return (
        <TripEnRoute
          pickupAddress={activeOrder.pickupAddress}
          etaMinutes={activeOrder.eta || 0}
          distanceKm={0}
          riderName={activeOrder.riderName || 'Rider'}
          riderRating={0}
          vehicleInfo={activeOrder.carType || ''}
          vehiclePlate=""
          pickupLat={0}
          pickupLng={0}
          isNearPickup={true /* ponytail: geofence gate needs pickup coords the Order type lacks */}
          onNavigate={() =>
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.pickupAddress)}&travelmode=driving`,
              '_blank',
            )
          }
          onArrived={async () => {
            await markArrived(orderId);
            setDutyState('ARRIVED');
          }}
          onCall={() => {/* rider phone not exposed on Order */}}
          onChat={() => {/* in-app chat opens from legacy sheet */}}
          onCancel={() => router.push('/driver')}
        />
      );

    case 'ARRIVED':
      if (!activeOrder) break;
      return (
        <TripArrived
          riderName={activeOrder.riderName || 'Rider'}
          riderRating={0}
          pickupAddress={activeOrder.pickupAddress}
          vehicleInfo={activeOrder.carType || ''}
          vehiclePlate=""
          waitStartedAt={Date.now()}
          freeWaitMinutes={5}
          onVerifyOtp={setEnteredOtp}
          onStartJob={async () => {
            // ponytail: odometer/fuel capture still lives in the legacy flow; preview sends defaults
            const ok = await startTrip(orderId, enteredOtp, 0, 100);
            if (ok) setDutyState('DELIVERING');
          }}
          onCall={() => {}}
          onChat={() => {}}
          onSendQuickMessage={() => {}}
          onCancel={() => router.push('/driver')}
        />
      );

    case 'DELIVERING':
      if (!activeOrder) break;
      return (
        <TripDelivering
          fareEstimate={0}
          fareRunning={0}
          elapsedMinutes={0}
          distanceKm={0}
          dropAddress={activeOrder.dropAddress}
          etaMinutes={activeOrder.eta || 0}
          riderName={activeOrder.riderName || 'Rider'}
          onNavigate={() =>
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.dropAddress)}&travelmode=driving`,
              '_blank',
            )
          }
          onCall={() => {}}
          onReportIssue={() => router.push('/driver-account/support')}
          onEndTrip={goToBill}
        />
      );

    case 'COMPLETED':
      if (!activeOrder) break;
      return (
        <TripComplete
          fareBreakdown={{ baseFare: 0, distanceCharge: 0, timeCharge: 0, waitCharge: 0, platformFee: 0, total: 0 }}
          distanceKm={0}
          durationMinutes={0}
          riderName={activeOrder.riderName || 'Rider'}
          dropAddress={activeOrder.dropAddress}
          onRate={() => {}}
          onDone={goToBill}
        />
      );
  }

  if (dutyState === 'ONLINE' || dutyState === 'EMERGENCY' ||
      (dutyState !== 'OFFLINE' && !activeOrder)) {
    return (
      <HomeOnline
        connectionStatus={connectionStatus}
        stats={{
          tripsCount: stats.todayJobs,
          earningsRupees: stats.todayEarnings,
          acceptanceRate: stats.acceptanceRate,
          rating: stats.rating,
        }}
        gpsError={gpsError}
        cooldownSecs={cooldownSecs}
        tripFilter={tripFilter}
        onTripFilterChange={setTripFilter}
        onGoOffline={goOffline}
        onReconnect={reconnect}
      />
    );
  }

  return (
    <HomeOffline
      driverName={user?.name || 'Driver'}
      stats={{
        tripsCount: stats.todayJobs,
        earningsRupees: stats.todayEarnings,
        onlineHours: stats.onlineHours,
        rating: stats.rating,
      }}
      upcomingJob={null}
      onGoOnline={goOnline}
    />
  );
}
