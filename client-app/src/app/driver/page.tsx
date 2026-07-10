'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDriverDutyStore } from '@/store/useDriverDutyStore';
import { useResilientWebSocket } from '@/hooks/useResilientWebSocket';
import { DriverTripManager } from '../../components/DriverTripManager';
import { SentryErrorBoundary } from '../../components/SentryErrorBoundary';
import dynamic from 'next/dynamic';
import type { MapDriver } from '@/components/map/DriverMap';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-background-secondary" />,
});
import { TabBar } from '@/components/TabBar';
import { UserIcon } from '@/components/ds/Icon';
import Link from 'next/link';
import { DevLocationSpoof } from '../../components/DevLocationSpoof';
import { SosModal } from '../../components/SosModal';
import { useSafetyStore } from '../../store/useSafetyStore';
import {
  getDriverProfile,
  getPendingOffer,
  OrderOffer,
  setDriverDutyState,
  getDriverDutyStats,
  driverArriveAtPickup,
  addOrderEvent,
  driverEndTrip,
  getDriverOrder,
  getFatigueCheck,
  FatigueCheckResponse,
  getDriverLocationStatus,
  DriverLocationStatus,
  sendDriverChat,
  startWait,
  resumeTrip,
  abandonTrip,
  getDriverRoute,
  getVehicles,
} from '@/api/client';
import { connectDispatchStream } from '@/services/dispatchStream';
import { connectHeatmapStream, HeatmapData } from '@/services/heatmapStream';
import { startTelemetryStream, TelemetryStreamHandle } from '@/services/telemetryStream';
import { attachForegroundPushHandler } from '@/services/notifications';
import { OfferPopup } from '@/components/OfferPopup';
import { RefreshIcon, SirenIcon, NavigateIcon, SignalIcon, FlameIcon, PauseIcon, ChatIcon, OctagonAlertIcon, ClockIcon } from '@/components/ds';
import { useOfferStore } from '@/store/useOfferStore';
import { openGoogleMapsNavigation } from '@/lib/map/navigation';
import { useToastStore } from '@/store/useToastStore';
import { friendlyError } from '@/lib/ui/errorMessage';

// Dispatch matching and SOS need the driver's real position; fall back to the
// KOL city center only when the device denies or can't produce a fix in time.
const KOL_CENTER = { lat: 22.5726, lng: 88.3639 };
function getDevicePosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(KOL_CENTER);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(KOL_CENTER),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 },
    );
  });
}

interface ActiveOrderAssignment {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_rating: number;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  quoted_fare_paise: number;
  vehicle_tier: string;
  transmission: string;
  trip_type: string; // "In-city" | "Outstation" | "Mini-outstation"
  special_notes?: string;
  backend_offer?: OrderOffer;
}

export default function DriverTerminalPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getDriverProfile>> | null>(null);
  const [kycPending, setKycPending] = useState(true); // Assume pending until profile loads
  
  // Account settings matching session or sandbox defaults
  const driverID = user?.id ?? '';
  const driverName = profile?.name || user?.name || 'Driver...';
  const cityPrefix = profile?.city_prefix || 'KOL'; // Regional Hub KOL

  const { dutyState, setDutyState, forceMatched } = useDriverDutyStore();
  const [activeTrip, setActiveTrip] = useState<ActiveOrderAssignment | null>(null);
  
  // Resilient WebSocket hook — single source of truth for the connection chip.
  const { status: connectionStatus, reconnect } = useResilientWebSocket(
    activeTrip?.order_id || 'global-driver',
    cityPrefix,
    dutyState !== 'OFFLINE'
  );

  // Mirror connectionStatus into a ref so the telemetry stream can probe live
  // connectivity without being torn down and re-created on every status change.
  const connectionStatusRef = useRef<typeof connectionStatus>(connectionStatus);
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
    // On reconnection, drain any GPS points buffered while we were offline.
    if (connectionStatus === 'CONNECTED') {
      telemetryStopRef.current?.flush();
    }
  }, [connectionStatus]);

  // Live ref to the active trip so the reconnect reconciler reads the latest value
  // without re-subscribing on every trip change.
  const activeTripRef = useRef(activeTrip);
  useEffect(() => { activeTripRef.current = activeTrip; }, [activeTrip]);

  // On every reconnect, reconcile local state against the server so a dropped socket can't
  // strand the driver on a stale 15s offer (reconcilePendingOffer) or on a trip the server
  // has already cancelled/completed while we were offline (no further frames would arrive).
  useEffect(() => {
    if (connectionStatus !== 'CONNECTED') return;
    const tok = useAuthStore.getState().token;
    if (!tok) return;
    void useOfferStore.getState().reconcilePendingOffer(tok);
    const trip = activeTripRef.current;
    const duty = useDriverDutyStore.getState().dutyState;
    if (trip?.order_id && (duty === 'EN_ROUTE' || duty === 'DELIVERING')) {
      void getDriverOrder(tok, trip.order_id)
        .then((order) => {
          if (['CANCELLED', 'COMPLETED', 'EXPIRED'].includes((order.status || '').toUpperCase())) {
            setActiveTrip(null);
            useDriverDutyStore.getState().setDutyState('ONLINE');
          }
        })
        .catch(() => { /* transient error — keep current state */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

  // Statistics polling state
  const [stats, setStats] = useState({
    trips_count: 0,
    earnings_rupees: 0,
    online_hours: 0,
    acceptance_rate: 100,
    rating: 5.0,
  });

  // Fatigue / mandatory-break monitor (polled every 5 min while ONLINE)
  const [fatigue, setFatigue] = useState<FatigueCheckResponse | null>(null);
  const [locStatus, setLocStatus] = useState<DriverLocationStatus | null>(null);
  const [cooldownSecs, setCooldownSecs] = useState(0);

  // SOS hold to confirm trigger states
  const sosHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sosHolding, setSosHolding] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  
  // Map settings and overlay triggers
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeVehicle, setActiveVehicle] = useState('');
  const [preferredTripFilter, setPreferredTripFilter] = useState<'ALL' | 'CITY' | 'OUTSTATION'>('ALL');
  
  

  
  // En-Route and Arrived timer trackers
  const [freeWaitSeconds, setFreeWaitSeconds] = useState(300); // 5-minute wait timer
  const [waitingCharges, setWaitingCharges] = useState(0);
  
  // Speedometer readings & fuel caps
  const [startOdometer, setStartOdometer] = useState('');
  const [startFuel, setStartFuel] = useState(75);
  const [startOdoPhoto, setStartOdoPhoto] = useState<string | null>(null);
  const [otpVerificationCode, setOtpVerificationCode] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Delivering states
  const [endOdometer, setEndOdometer] = useState('');
  const [endFuel, setEndFuel] = useState(72);
  const [endOdoPhoto, setEndOdoPhoto] = useState<string | null>(null);
  
  // Extra billable inputs added mid-trip
  const [tollCharges, setTollCharges] = useState(0);
  const [parkingCharges, setParkingCharges] = useState(0);
  
  // Post-trip ratings

  // Wait timer reference time and Cancel picker overlay states
  const [arrivedTime, setArrivedTime] = useState<Date | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  
  // Map visualization state: simulated marker position along route (0 to 100%)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
  const routeOriginRef = useRef<{ lat: number; lng: number } | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

  // Live Audit Telemetry Log Vault
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [mapDrivers, setMapDrivers] = useState<MapDriver[]>([]);

  // In-app chat with the rider (pickup coordination)
  const [chat, setChat] = useState<{ from: string; text: string; ts: number }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  // Mid-trip WAITING (round-trip destination wait, billed)
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);

  // Rider's live pin during first-mile (two-way location)
  const [riderPin, setRiderPin] = useState<{ lat: number; lng: number } | null>(null);

  // Set when GPS can't be read while online — the driver is then invisible to
  // dispatch and receives no trips, so this must be shown, not swallowed.
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Core structural pointers
  const telemetryStopRef = useRef<TelemetryStreamHandle | null>(null);
  const streamRef = useRef<(() => void) | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sosTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startSosHold = () => {
    if (useSafetyStore.getState().isEmergencyActive) return;
    setSosHolding(true);
    setSosProgress(0);

    const startTime = Date.now();
    const duration = 2000;

    sosHoldTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setSosProgress(progress);

      if (progress >= 100) {
        clearInterval(sosHoldTimerRef.current!);
        sosHoldTimerRef.current = null;
        setSosHolding(false);
        setSosProgress(0);
        const orderId = activeTrip?.order_id || "";
        void getDevicePosition().then((pos) => {
          useSafetyStore.getState().triggerSOS(pos.lat, pos.lng, orderId);
        });
      }
    }, 50);
  };

  const cancelSosHold = () => {
    if (sosHoldTimerRef.current) {
      clearInterval(sosHoldTimerRef.current);
      sosHoldTimerRef.current = null;
    }
    setSosHolding(false);
    setSosProgress(0);
  };

  // Auto audit log logger
  const logAudit = (event: string, meta: any) => {
    const timestamp = new Date().toISOString();
    const logString = `[${timestamp.slice(11, 19)}] ${event} | ${JSON.stringify(meta)}`;
    console.log(logString);
    setAuditLogs((prev) => [logString, ...prev].slice(0, 50));
    
    // Save to session storage
    try {
      const stored = JSON.parse(sessionStorage.getItem('driver_trip_logs') || '[]');
      stored.push({ ts: timestamp, event, meta });
      sessionStorage.setItem('driver_trip_logs', JSON.stringify(stored));
    } catch {}
  };

  // Setup initial session storage logs cleanup or load
  useEffect(() => {
    logAudit('SESSION_STARTED', { driverID, device: navigator.userAgent });
    return () => {
      telemetryStopRef.current?.stop();
      streamRef.current?.();
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showHeatmap) {
      setHeatmapData(null);
      return;
    }

    return connectHeatmapStream((data) => {
      setHeatmapData(data);
    });
  }, [showHeatmap]);

  // Wait time calculator once arrived
  useEffect(() => {
    if (dutyState === 'ARRIVED') {
      let currentArrivedTime = arrivedTime;
      if (!currentArrivedTime) {
        currentArrivedTime = new Date();
        setArrivedTime(currentArrivedTime);
      }
      waitTimerRef.current = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - currentArrivedTime!.getTime()) / 1000));
        
        const remainingFree = Math.max(0, 300 - elapsedSeconds);
        setFreeWaitSeconds(remainingFree);
        
        if (elapsedSeconds > 300) {
          const excessSeconds = elapsedSeconds - 300;
          setWaitingCharges(excessSeconds * (2 / 60));
        } else {
          setWaitingCharges(0);
        }
      }, 1000);
    } else {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      setArrivedTime(null);
    }
    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    };
  }, [dutyState, arrivedTime]);

  // Mid-trip wait meter — ticks every second while waiting at the destination.
  useEffect(() => {
    if (!isWaiting) return;
    const t = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isWaiting]);

  // Poll stats every 30 seconds when not offline
  useEffect(() => {
    if (!token || dutyState === 'OFFLINE') return;

    const fetchStats = async () => {
      try {
        const data = await getDriverDutyStats(token);
        setStats(data);
      } catch (err) {
        console.warn('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [token, dutyState]);

  // Fatigue monitor: poll every 5 minutes while ONLINE. Surface a mandatory-break
  // banner when the server says the driver must rest (or has no hours remaining).
  useEffect(() => {
    if (!token || dutyState !== 'ONLINE') return;

    const checkFatigue = async () => {
      try {
        const data = await getFatigueCheck(token);
        setFatigue(data);
        if (data.must_take_break || data.hours_remaining <= 0) {
          logAudit('FATIGUE_BREAK_REQUIRED', { hours_remaining: data.hours_remaining });
        }
      } catch (err) {
        console.warn('Failed to fetch fatigue check:', err);
      }
    };

    checkFatigue();
    const interval = setInterval(checkFatigue, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, dutyState]);

  // GPS-staleness + decline-cooldown monitor: poll every 20s while ONLINE so the driver
  // sees why dispatch isn't reaching them (stale GPS → invisible, or post-decline cooldown).
  useEffect(() => {
    if (!token || dutyState !== 'ONLINE') return;

    const checkLocation = async () => {
      try {
        const data = await getDriverLocationStatus(token);
        setLocStatus(data);
        if (data.on_cooldown) setCooldownSecs(data.cooldown_expires_in_seconds);
      } catch (err) {
        console.warn('Failed to fetch location status:', err);
      }
    };

    checkLocation();
    const interval = setInterval(checkLocation, 20000);
    return () => clearInterval(interval);
  }, [token, dutyState]);

  // Local 1s tick for the cooldown countdown; re-synced by each 20s poll above.
  useEffect(() => {
    if (cooldownSecs <= 0) return;
    const t = setTimeout(() => setCooldownSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldownSecs]);

  // Offer poll fallback: the WS AssignmentFrame is the primary wake signal but has no
  // retry — a single dropped frame would leave an idle-online driver silently offerless
  // (only recoverable by reconnect or an off/on toggle). Poll the authoritative REST
  // offer endpoint every 10s while ONLINE as a safety net; the 15s offer lease means a
  // 10s cadence still leaves time to respond.
  useEffect(() => {
    if (!token || dutyState !== 'ONLINE') return;

    const pollOffer = async () => {
      try {
        const res = await getPendingOffer(token);
        if (
          res.order &&
          (res.offer_expires_in_seconds ?? 0) > 0 &&
          useDriverDutyStore.getState().dutyState === 'ONLINE'
        ) {
          useOfferStore.getState().setOffer(res.order, res.offer_expires_in_seconds);
          useDriverDutyStore.getState().setDutyState('OFFER_PENDING');
          logAudit('INCOMING_OFFER_RECEIVED', { orderId: res.order.orderId, source: 'HTTP_POLL' });
        }
      } catch {
        // transient — next tick retries
      }
    };

    const interval = setInterval(pollOffer, 10000);
    return () => clearInterval(interval);
  }, [token, dutyState]);

  // Server-side forced-offline reconciliation: the telemetry pruner takes a driver
  // offline server-side when GPS goes stale (>60s), and an admin can too. Without this
  // check the app keeps showing "Online" while the driver is unmatchable — a zombie
  // state that previously persisted until a manual off/on toggle. Mirror a server
  // OFFLINE locally and tell the driver why.
  useEffect(() => {
    if (!token || dutyState !== 'ONLINE') return;

    const reconcileDuty = async () => {
      try {
        const p = await getDriverProfile(token);
        if (p.current_state === 'OFFLINE' && useDriverDutyStore.getState().dutyState === 'ONLINE') {
          closeOnlineStreams();
          setDutyState('OFFLINE');
          setActiveTrip(null);
          useToastStore.getState().show(
            'You were taken offline — GPS signal was lost. Go online again when ready.',
            'error',
          );
          logAudit('DUTY_FORCED_OFFLINE', { source: 'SERVER_RECONCILE' });
        }
      } catch {
        // transient — next tick retries
      }
    };

    const interval = setInterval(reconcileDuty, 30000);
    return () => clearInterval(interval);
  }, [token, dutyState]);

  // Real device GPS drives the map marker while a trip is live (the telemetry
  // stream posts the same positions to the backend independently).
  useEffect(() => {
    if (dutyState !== 'EN_ROUTE' && dutyState !== 'DELIVERING') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setCurrentPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setMapDrivers([{
          id: driverID,
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          bearing: p.coords.heading || 0,
          speed: (p.coords.speed || 0) * 3.6,
        }]);
      },
      (err) => console.warn('[DRIVER_MAP] GPS watch error:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [dutyState, driverID]);

  // Registered vehicle for audit/trip metadata — from the vehicles API, not a
  // hardcoded plate.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getVehicles(token)
      .then(({ vehicles }) => {
        if (!cancelled && vehicles?.length) {
          const v = vehicles[0];
          setActiveVehicle(`${v.plate} (${v.make} ${v.model})`);
        }
      })
      .catch(() => { /* metadata only — leave blank on failure */ });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Road-following route polyline for the in-trip map. Refetched when the trip
  // leg changes or the driver moves >250m from the last routed origin; the
  // backend caches identical origins so this stays cheap.
  useEffect(() => {
    const target =
      activeTrip && dutyState === 'DELIVERING'
        ? { lat: activeTrip.dropoff_lat, lng: activeTrip.dropoff_lng }
        : activeTrip && (dutyState === 'EN_ROUTE' || dutyState === 'ARRIVED')
          ? { lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lng }
          : null;
    if (!token || !target?.lat || !target?.lng) {
      setRoutePath(null);
      routeOriginRef.current = null;
      return;
    }
    if (currentPos && routeOriginRef.current) {
      const movedKm =
        Math.hypot(
          (currentPos.lat - routeOriginRef.current.lat) * 110.57,
          (currentPos.lng - routeOriginRef.current.lng) * 111.32 * Math.cos((currentPos.lat * Math.PI) / 180),
        );
      if (movedKm < 0.25) return; // still on the routed path
    }
    let cancelled = false;
    routeOriginRef.current = currentPos;
    getDriverRoute(token, currentPos, target)
      .then((r) => {
        if (!cancelled && r?.geometry?.length >= 2) setRoutePath(r.geometry);
      })
      .catch(() => { /* straight-line fallback is drawn by the map itself */ });
    return () => {
      cancelled = true;
    };
  }, [token, dutyState, activeTrip, currentPos]);

  // hydrateForceMatch pulls a directly-assigned (force-matched) order, builds the active
  // trip from it, and pushes the driver into EN_ROUTE with a banner. Coordinates and fare
  // come from the order endpoint; rider name/address text is not stored server-side.
  const hydrateForceMatch = async (orderId: string) => {
    if (!token) return;
    if (useDriverDutyStore.getState().dutyState === 'EN_ROUTE' && activeTrip?.order_id === orderId) {
      return; // already handling this assignment
    }
    try {
      const order = await getDriverOrder(token, orderId);
      setActiveTrip({
        order_id: order.id,
        customer_name: 'Assigned Rider',
        customer_phone: 'Unavailable',
        customer_rating: 5,
        pickup_address: `Pickup (${order.pickup_lat.toFixed(4)}, ${order.pickup_lng.toFixed(4)})`,
        pickup_lat: order.pickup_lat,
        pickup_lng: order.pickup_lng,
        dropoff_address: `Drop (${order.dropoff_lat.toFixed(4)}, ${order.dropoff_lng.toFixed(4)})`,
        dropoff_lat: order.dropoff_lat,
        dropoff_lng: order.dropoff_lng,
        quoted_fare_paise: order.base_fare_paise,
        vehicle_tier: activeVehicle,
        transmission: 'ANY',
        trip_type: 'CITY',
        special_notes: 'Assigned by dispatch (force-match)',
      });
      useDriverDutyStore.getState().setForceMatched(true);
      setDutyState('EN_ROUTE');
      logAudit('FORCE_MATCH_RECEIVED', { orderId });
    } catch (err) {
      console.warn('[FORCE_MATCH] Failed to hydrate force-matched order:', err);
    }
  };

  const openOnlineStreams = () => {
    // Need both an auth token and a real driver id — never open telemetry/dispatch
    // streams under a placeholder identity.
    if (!token || !driverID) return;
    setGpsError(null); // fresh attempt; re-set by onGpsError if GPS still fails

    if (!telemetryStopRef.current) {
      telemetryStopRef.current = startTelemetryStream({
        token,
        driverId: driverID,
        cityPrefix,
        // While not CONNECTED, GPS points buffer locally and flush on reconnect.
        isConnected: () => connectionStatusRef.current === 'CONNECTED',
        // No location = invisible to dispatch. Make that loud instead of silent.
        onGpsError: (msg) => {
          setGpsError(msg);
          useToastStore.getState().show(msg, 'error');
        },
      });
      logAudit('TELEMETRY_STREAM_STARTED', { driverID, cityPrefix });
    }

    if (!streamRef.current) {
      // The order_id this stream sends only needs to be non-empty to clear the gateway's
      // 400 guard (handler.go:270-271); its value is stored but never looked up. Assignment
      // is delivered via the backend-generated "driver:{id}" session key derived from the JWT
      // ticket identity (handler.go:292-293, 364), not from this string.
      streamRef.current = connectDispatchStream(
        `driver-session-${driverID}`,
        token,
        {
          onAssignment: (frame) => {
            // Rider cancelled the order — arrives as an AssignmentFrame with status CANCELLED.
            // Clear any pending offer / active assignment and return to searching.
            if (frame.status === 'CANCELLED') {
              logAudit('ORDER_CANCELLED_BY_RIDER', { orderId: frame.order_id, source: 'WEBSOCKET' });
              useOfferStore.getState().clearOffer();
              useDriverDutyStore.getState().setDutyState('ONLINE');
              useToastStore.getState().show('Trip cancelled by the rider. Back to searching.', 'info');
              return;
            }
            void getPendingOffer(token)
              .then((pendingOffer) => {
                if (pendingOffer.order) {
                  // Normal flow: a pending 15s offer exists. Only surface it while ONLINE.
                  if (useDriverDutyStore.getState().dutyState === 'ONLINE') {
                    useOfferStore.getState().setOffer(pendingOffer.order, pendingOffer.offer_expires_in_seconds);
                    useDriverDutyStore.getState().setDutyState('OFFER_PENDING');
                    logAudit('INCOMING_OFFER_RECEIVED', { orderId: pendingOffer.order.orderId, source: 'WEBSOCKET' });
                  }
                  return;
                }
                // No pending offer but an ASSIGNED frame arrived: this is an admin
                // force-match (a direct assignment, not a 15s offer). Hydrate it and push
                // the driver into the trip with a banner — never silently drop it.
                if (frame.status === 'ASSIGNED' && frame.order_id) {
                  void hydrateForceMatch(frame.order_id);
                }
              })
              .catch((err) => console.warn('[DRIVER_OFFER] Assignment hydration failed:', err));
          },
          onTelemetry: (frame) => {
            logAudit('WS_TELEMETRY_FRAME', {
              orderId: frame.order_id,
              lat: frame.latitude,
              lng: frame.longitude,
              speed_kms: frame.speed_kms,
            });
            setMapDrivers([{
              id: frame.driver_id || driverID,
              latitude: frame.latitude,
              longitude: frame.longitude,
              bearing: frame.bearing || 0,
              speed: frame.speed_kms || 0
            }]);
          },
          onChat: (m) => {
            setChat((c) => [...c, m]);
            setChatOpen(true);
          },
          onRiderLocation: (loc) => {
            if (loc.lat !== 0 || loc.lng !== 0) setRiderPin(loc);
          },
          onClose: () => {
            logAudit('WS_CONNECTION_STATE', { status: 'DISCONNECTED' });
            streamRef.current = null;
          },
        },
        cityPrefix,
      );
      logAudit('WS_CONNECTION_STATE', { status: 'CONNECTED' });
    }

    void getPendingOffer(token)
      .then((pendingOffer) => {
        if (pendingOffer.order && (pendingOffer.offer_expires_in_seconds ?? 0) > 0) {
          const currentDutyState = useDriverDutyStore.getState().dutyState;
          if (currentDutyState !== 'ONLINE') {
            console.warn('[DRIVER_OFFER] Ignoring fallback offer since duty state is:', currentDutyState);
            return;
          }
          useOfferStore.getState().setOffer(pendingOffer.order);
          useDriverDutyStore.getState().setDutyState('OFFER_PENDING');
          logAudit('INCOMING_OFFER_RECEIVED', { orderId: pendingOffer.order.orderId, source: 'HTTP_FALLBACK' });
        }
      })
      .catch((err) => {
        console.warn('[DRIVER_OFFER] Pending offer fallback fetch failed:', err);
      });
  };

  const closeOnlineStreams = () => {
    setGpsError(null);
    telemetryStopRef.current?.stop();
    streamRef.current?.();
    telemetryStopRef.current = null;
    streamRef.current = null;
  };

  useEffect(() => {
    if (!token) {
      router.push('/login?role=driver');
      return;
    };

    let cancelled = false;

    // FCM foreground pushes surface the offer popup (third delivery path after WS + poll).
    void attachForegroundPushHandler().catch(() => { /* messaging unsupported — WS + poll cover it */ });

    getDriverProfile(token)
      .then((fetchedProfile) => {
        if (cancelled) return;
        
        setProfile(fetchedProfile);

        // Redirect based on KYC / Verification status
        const status = fetchedProfile.verification_status || 'ONBOARDING';
        if (status === 'ONBOARDING' || status === 'REJECTED') {
          router.push('/driver-onboarding');
          return;
        }
        
        setKycPending(status === 'PENDING');

        // Set initial duty state from profile
        if (fetchedProfile.current_state === 'ONLINE_AVAILABLE') {
          setDutyState('ONLINE');
          openOnlineStreams();
        } else if (fetchedProfile.current_state === 'ONLINE_EN_ROUTE') {
          setDutyState('EN_ROUTE');
        } else if (fetchedProfile.current_state === 'ONLINE_DELIVERING') {
          setDutyState('DELIVERING');
        } else {
          setDutyState('OFFLINE');
        }

        // Set initial stats from profile
        setStats(prev => ({
          ...prev,
          trips_count: fetchedProfile.total_trips || 0,
          acceptance_rate: fetchedProfile.acceptance_rate * 100,
          cancellation_rate: fetchedProfile.cancellation_rate * 100,
        }));
      })
      .catch((err) => {
        console.warn('[DRIVER_PROFILE] Initial hydration failed:', err);
        // If profile fails, logout to force re-authentication
        useAuthStore.getState().logout();
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Go Online/Offline state changes
  const handleToggleDutySwitch = async () => {
    if (dutyState === 'OFFLINE') {
      if (token) {
        try {
          const pos = await getDevicePosition();
          await setDriverDutyState(token, 'ONLINE', pos.lat, pos.lng);
        } catch (err) {
          console.warn('[DRIVER_STATUS] Online duty state sync failed:', err);
        }
      }

      setDutyState('ONLINE');
      logAudit('DUTY_ONLINE', { vehicle: activeVehicle, filter: preferredTripFilter });
      openOnlineStreams();

    } else {
      if (token) {
        try {
          await setDriverDutyState(token, 'OFFLINE');
        } catch (err) {
          console.warn('[DRIVER_STATUS] Offline duty state sync failed:', err);
        }
      }

      // Clean teardown and hardware release routine
      closeOnlineStreams();
      
      setDutyState('OFFLINE');
      setActiveTrip(null);
      logAudit('DUTY_OFFLINE', { driverID });
    }
  };

  const { currentOffer, status: offerStatus } = useOfferStore();

  useEffect(() => {
    if (offerStatus === 'ACCEPTED' && currentOffer) {
      setActiveTrip({
        order_id: currentOffer.orderId,
        customer_name: currentOffer.riderName,
        customer_phone: currentOffer.riderPhone || 'Unavailable',
        customer_rating: currentOffer.riderRating,
        pickup_address: currentOffer.pickup.address,
        pickup_lat: currentOffer.pickup.lat,
        pickup_lng: currentOffer.pickup.lng,
        dropoff_address: currentOffer.drop.address,
        dropoff_lat: currentOffer.drop.lat,
        dropoff_lng: currentOffer.drop.lng,
        quoted_fare_paise: currentOffer.fareEstimate,
        vehicle_tier: currentOffer.carTypeRequested || 'PREMIUM_SUV',
        transmission: currentOffer.transmissionRequired || 'AUTOMATIC',
        trip_type: currentOffer.tripType,
        special_notes: currentOffer.notes,
        backend_offer: currentOffer,
      });
      // Auto-launch turn-by-turn navigation to pickup the moment the job is accepted
      // (DriveU-style). On mobile (Capacitor) this opens the Google Maps app; on web it
      // opens a new tab. Fires once — clearOffer below flips offerStatus so the guard
      // above won't re-run.
      if (currentOffer.pickup.lat && currentOffer.pickup.lng) {
        openGoogleMapsNavigation({ lat: currentOffer.pickup.lat, lng: currentOffer.pickup.lng });
      }
      // Clear offer from store now that it is active
      useOfferStore.getState().clearOffer();
    }
  }, [offerStatus, currentOffer]);

  const handleArrivedAtPickup = async () => {
    logAudit('ARRIVED_AT_PICKUP_NODE', { orderId: activeTrip?.order_id, time: new Date().toISOString() });
    setDutyState('ARRIVED');
    setArrivedTime(new Date());
    setFreeWaitSeconds(300);
    setWaitingCharges(0);

    if (activeTrip?.order_id) {
      try {
        if (token) {
          await driverArriveAtPickup(token, activeTrip.order_id);
        }
      } catch (err) {
        console.warn('Arrive sync failed:', err);
      }
    }
  };

  const handleTollAddition = async () => {
    if (activeTrip?.order_id && token) {
      try {
        await addOrderEvent(token, activeTrip.order_id, {
          event_type: 'ADD_TOLL',
          amount_paise: 5000,
          description: 'Highway toll fee added mid-trip',
        });
        setTollCharges((prev) => prev + 50);
        logAudit('BILLING_MODIFIER_ADDED', { type: 'TOLL', amount: 50 });
      } catch {
        useToastStore.getState().show('Failed to record the toll on the server. Try again.', 'error');
      }
    } else {
      setTollCharges((prev) => prev + 50);
    }
  };

  const handleParkingAddition = async () => {
    if (activeTrip?.order_id && token) {
      try {
        await addOrderEvent(token, activeTrip.order_id, {
          event_type: 'ADD_STOP',
          amount_paise: 3000,
          description: 'Stop/parking fee added mid-trip',
        });
        setParkingCharges((prev) => prev + 30);
        logAudit('BILLING_MODIFIER_ADDED', { type: 'PARKING', amount: 30 });
      } catch {
        useToastStore.getState().show('Failed to record the parking charge on the server. Try again.', 'error');
      }
    } else {
      setParkingCharges((prev) => prev + 30);
    }
  };

  const handleSlideToEndTrip = async () => {
    if (!endOdometer) {
      useToastStore.getState().show('Enter the end odometer reading before finalizing.', 'error');
      return;
    }
    const startNum = parseFloat(startOdometer);
    const endNum = parseFloat(endOdometer);

    if (isNaN(startNum) || isNaN(endNum) || endNum <= startNum) {
      useToastStore.getState().show(`End odometer must be greater than the start value (${startOdometer} KM).`, 'error');
      return;
    }

    logAudit('TRIP_END_COMMITTED', {
      orderId: activeTrip?.order_id,
      endOdometer,
      endFuel,
      tolls: tollCharges,
      parking: parkingCharges
    });

    // No local/mock bill fallback: the bill page confirms payment against the
    // backend, which requires the order to really be COMPLETED. Faking a bill
    // here would let the driver collect against numbers the ledger never saw.
    if (!activeTrip?.order_id || !token) {
      useToastStore.getState().show('Session expired — log in again to end the trip.', 'error');
      return;
    }
    try {
      const bill = await driverEndTrip(token, activeTrip.order_id, {
        odometer_reading: parseInt(endOdometer, 10),
        fuel_level: endFuel,
        photo_url: endOdoPhoto || '',
      });
      logAudit('TRIP_END_SYNCED', { orderId: activeTrip.order_id, total: bill.total_fare_paise });
      try {
        sessionStorage.setItem(`final_bill_${activeTrip.order_id}`, JSON.stringify(bill));
        sessionStorage.setItem('current_final_bill', JSON.stringify(bill));
      } catch {}
      setDutyState('COMPLETED');
      router.push(`/driver/trip/bill?order_id=${activeTrip.order_id}`);
    } catch (err) {
      console.warn('End trip sync failed:', err);
      useToastStore.getState().show(friendlyError(err), 'error');
      // Stay in DELIVERING so the driver can retry the slide once connectivity is back.
    }
  };

  if (kycPending) {
    return (
      <div className="min-h-screen bg-background-primary text-content-primary p-6 sm:p-12 font-body flex flex-col justify-between">
        <header className="border-b border-border-opaque pb-6 text-left">
          <h1 className="text-heading-large font-mono tracking-tight uppercase">VAHNLY</h1>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
          <div className="h-16 w-16 rounded-pill bg-background-secondary border border-border-opaque flex items-center justify-center text-content-secondary animate-pulse">
            <ClockIcon size={28} />
          </div>
          <div className="space-y-3">
            <span className="badge badge-neutral">
              KYC Compliance Review
            </span>
            <h2 className="text-heading-xl text-content-primary">Application Pending Verification</h2>
            <p className="text-paragraph-medium text-content-secondary max-w-sm">
              Your onboarding documents (Aadhaar, DL, Police Verification) are being validated by our regional compliance team. This normally takes 12–24 hours.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <button
              onClick={() => {
                if (token) {
                  getDriverProfile(token)
                    .then((profile) => {
                      if (profile.verification_status === 'VERIFIED') {
                        setKycPending(false);
                        window.location.reload();
                      } else {
                        useToastStore.getState().show('Application still under review. Check back later or contact support.', 'info');
                      }
                    })
                    .catch(() => useToastStore.getState().show('Failed to check status. Try again later.', 'error'));
                }
              }}
              className="w-full h-14 rounded-sm bg-interactive-primary text-interactive-primary-text
                text-label-large font-medium cursor-pointer transition-base
                hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="inline-flex items-center justify-center gap-2"><RefreshIcon size={18} /> Refresh Status</span>
            </button>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/login?role=driver');
              }}
              className="w-full h-12 rounded-sm bg-background-secondary border border-border-opaque
                text-label-medium text-content-secondary cursor-pointer transition-base
                hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              Sign Out
            </button>
          </div>
        </main>

        <footer className="text-center text-label-small text-content-tertiary font-mono pt-6 border-t border-border-opaque">
          KYC_COMPLIANCE_PENDING_GATEWAY
        </footer>
      </div>
    );
  }

  const triggerSOS = () => {
    const orderId = activeTrip?.order_id || "";
    void getDevicePosition().then((pos) => {
      useSafetyStore.getState().triggerSOS(pos.lat, pos.lng, orderId);
    });
    logAudit('SOS_CRITICAL_TRIGGERED', { driverID, time: new Date().toISOString() });
  };

  const handleSendChat = async (text: string) => {
    const t = text.trim();
    if (!t || !activeTrip?.order_id || !token) return;
    setChat((c) => [...c, { from: 'DRIVER', text: t, ts: Date.now() / 1000 }]);
    setChatInput('');
    try { await sendDriverChat(token, activeTrip.order_id, t); } catch { /* best-effort */ }
  };

  const handleToggleWait = async () => {
    if (!activeTrip?.order_id || !token) return;
    if (!isWaiting) {
      try { await startWait(token, activeTrip.order_id); setIsWaiting(true); setWaitSeconds(0); logAudit('WAIT_STARTED', { orderId: activeTrip.order_id }); }
      catch { /* ignore */ }
    } else {
      try { await resumeTrip(token, activeTrip.order_id); setIsWaiting(false); logAudit('WAIT_RESUMED', { orderId: activeTrip.order_id }); }
      catch { /* ignore */ }
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-content-primary p-0 font-sans flex flex-col justify-between selection:bg-forest-400 selection:text-white overflow-x-hidden relative">
      
      {/* 1. SOS EMERGENCY PULSE TRIGGER MODAL */}
      <SosModal />

      {/* DEV-ONLY: GPS location spoof (tree-shaken out of prod) */}
      <DevLocationSpoof />

      {/* MANDATORY BREAK BANNER — fatigue safety gate */}
      {fatigue && (fatigue.must_take_break || fatigue.hours_remaining <= 0) && dutyState !== 'OFFLINE' && (
        <div className="fixed top-0 inset-x-0 z-[100002] bg-negative-400 px-4 py-3 flex items-center justify-center gap-2 font-mono text-label-small text-white shadow-elevation-2 text-center">
          <span className="flex items-center animate-pulse"><OctagonAlertIcon size={18} /></span>
          <span className="font-bold uppercase tracking-wider">
            Mandatory rest break required — {fatigue.message || 'you have reached the daily driving limit. Please go offline and rest.'}
          </span>
        </div>
      )}

      {/* GPS STALENESS BANNER — driver is online but their last ping is >30s old, so the
          dispatch scanner can't see them. Hidden while on cooldown (that banner takes priority). */}
      {dutyState === 'ONLINE' && locStatus && !locStatus.is_visible_to_dispatch && !locStatus.on_cooldown && (
        <div className="fixed top-0 inset-x-0 z-[100000] bg-surface-warning px-4 py-2.5 flex items-center justify-center gap-2 font-mono text-label-small text-content-warning shadow-elevation-1 text-center">
          <span className="flex items-center animate-pulse"><SignalIcon size={18} /></span>
          Your GPS signal is weak. Move to an open area to receive ride requests.
        </div>
      )}

      {/* DECLINE COOLDOWN BANNER — driver recently declined/timed-out an offer. */}
      {dutyState === 'ONLINE' && locStatus?.on_cooldown && cooldownSecs > 0 && (
        <div className="fixed top-0 inset-x-0 z-[100000] bg-background-secondary border-b border-border-opaque px-4 py-2.5 flex items-center justify-center gap-2 font-mono text-label-small text-content-secondary shadow text-center">
          <span className="flex items-center"><ClockIcon size={16} /></span>
          You declined a ride. New requests resume in {cooldownSecs}s.
        </div>
      )}

      {/* FORCE-MATCH BANNER */}
      {forceMatched && dutyState !== 'ONLINE' && dutyState !== 'OFFLINE' && (
        <div className="fixed top-0 inset-x-0 z-[100001] bg-surface-warning px-4 py-2.5 flex items-center justify-center gap-2 font-mono text-label-small text-content-warning shadow-elevation-1">
          <span className="animate-pulse">●</span>
          Assigned by dispatch — proceed to pickup. This trip was force-matched to you.
        </div>
      )}

      {/* CONNECTIVITY DEGRADED BANNER */}
      {connectionStatus === 'RECONNECTING' && dutyState !== 'OFFLINE' && (
        <div className="fixed top-0 inset-x-0 z-[100000] bg-background-secondary border-b border-border-opaque px-4 py-2 flex items-center justify-center gap-2 font-mono text-label-small text-content-secondary shadow">
          <span className="h-2 w-2 rounded-full border border-content-warning border-t-transparent animate-spin" />
          Reconnecting to dispatch — you won&apos;t receive new offers until the link is restored.
        </div>
      )}

      {/* 3. INCOMING BOOKING OFFER MODAL SHEET OVERLAY */}
      <OfferPopup />

      {/* CANCEL ALLOCATION PICKER OVERLAY */}
      {showCancelModal && activeTrip && (
        <div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background-primary border border-border-opaque p-6 rounded-lg w-full max-w-sm space-y-4 text-left shadow-elevation-3">
            <div>
              <h3 className="text-heading-small text-content-primary">Cancel Allocation</h3>
              <p className="text-paragraph-small text-content-secondary mt-1">Select a reason. Penalty charges may apply.</p>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Rider No Show', value: 'RIDER_NO_SHOW' },
                { label: 'Wrong Address', value: 'WRONG_ADDRESS' },
                { label: 'Vehicle Breakdown', value: 'VEHICLE_BREAKDOWN' },
                { label: 'Safety Concerns', value: 'SAFETY' },
                { label: 'Other', value: 'OTHER' },
              ].map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSelectedCancelReason(reason.value)}
                  className={[
                    'w-full text-left h-11 px-4 rounded-sm border text-label-medium transition-base cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
                    selectedCancelReason === reason.value
                      ? 'bg-surface-negative border-negative-300 text-content-negative'
                      : 'bg-background-secondary border-border-opaque text-content-secondary hover:text-content-primary',
                  ].join(' ')}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setShowCancelModal(false); setSelectedCancelReason(''); }}
                className="h-11 rounded-sm bg-background-secondary border border-border-opaque
                  text-label-medium text-content-secondary cursor-pointer hover:bg-background-tertiary
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedCancelReason) { useToastStore.getState().show('Select a cancellation reason first.', 'error'); return; }
                  logAudit('TRIP_CANCELLED_BY_DRIVER', { orderId: activeTrip.order_id, reason: selectedCancelReason });
                  // Tell the backend so the order re-queues and the no-show penalty applies
                  // (only meaningful once the driver has accepted, i.e. EN_ROUTE/ARRIVED).
                  if (token && activeTrip?.order_id) void abandonTrip(token, activeTrip.order_id).catch(() => {});
                  setActiveTrip(null);
                  setDutyState('ONLINE');
                  setShowCancelModal(false);
                  setSelectedCancelReason('');
                }}
                className="h-11 rounded-sm bg-negative-400 text-white text-label-medium font-medium
                  cursor-pointer hover:bg-negative-500 transition-base
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative-400"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="bg-background-primary border-b border-border-opaque px-4 py-3 sticky top-0 z-50 flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <Link
            href="/driver-account/profile"
            className="h-11 w-11 bg-background-secondary hover:bg-background-tertiary rounded-sm border border-border-opaque
              flex items-center justify-center text-content-primary cursor-pointer transition-base active:scale-95
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            aria-label="Account"
          >
            <UserIcon size={20} />
          </Link>
          <div>
            <h1 className="text-label-large font-mono tracking-tight uppercase text-content-primary">VAHNLY</h1>
            <div className="flex items-center gap-1.5 mt-0.5 font-mono text-label-small text-content-tertiary">
              <span>HUB: {cityPrefix}</span>
              <span>·</span>
              <span>{dutyState}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {dutyState !== 'OFFLINE' && (
            <span role="status" aria-live="polite">{
            connectionStatus === 'OFFLINE' ? (
              <button
                type="button"
                onClick={reconnect}
                className="badge badge-negative cursor-pointer hover:opacity-80 min-h-[36px] px-3
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative-400"
              >
                <span className="status-dot status-dot-negative" />
                <span className="ml-1">Offline · Retry</span>
              </button>
            ) : connectionStatus === 'CONNECTED' ? (
              <span className="badge badge-positive">
                <span className="status-dot status-dot-online" />
                <span className="ml-1">Connected</span>
              </span>
            ) : (
              <span className="badge badge-warning">
                <span className="status-dot status-dot-pending" />
                <span className="ml-1">Reconnecting</span>
              </span>
            )
          }</span>)}

          {/* SOS — 2-second hold */}
          <button
            onMouseDown={startSosHold}
            onMouseUp={cancelSosHold}
            onMouseLeave={cancelSosHold}
            onTouchStart={startSosHold}
            onTouchEnd={cancelSosHold}
            className="relative overflow-hidden bg-negative-400 hover:bg-negative-500
              text-white text-label-small font-medium
              h-9 px-3 rounded-pill
              cursor-pointer select-none transition-base
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative-400"
            style={{ minWidth: '80px' }}
          >
            {sosHolding && (
              <span className="absolute inset-0 bg-negative-600 transition-none" style={{ width: `${sosProgress}%` }} />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5"><SirenIcon size={15} /> SOS {sosHolding ? `${Math.round(sosProgress)}%` : '(Hold)'}</span>
          </button>
        </div>
      </header>

      {/* GPS-off warning: without a location fix the driver is invisible to
          dispatch and gets zero trips — surface it prominently, not silently. */}
      {gpsError && (
        <div role="alert" className="bg-surface-negative border-b border-negative-300 px-4 py-2.5 text-center text-label-medium text-content-negative">
          {gpsError}
        </div>
      )}

      {/* CORE AREA: MAP LAYOUT AND VIEWS */}
      <main className="flex-1 flex flex-col relative min-h-[350px]">
        <div
          className="absolute inset-0 bg-background-primary z-0 overflow-hidden flex items-center justify-center"
          style={{ filter: dutyState === 'OFFLINE' ? 'grayscale(1) opacity(0.6)' : 'none' }}
        >
          {dutyState === 'OFFLINE' ? (
            <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-border-opaque" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          ) : (
            <div className="w-full h-full">
              <DriverMap
                drivers={mapDrivers}
                h3Hexagons={
                  heatmapData
                    ? Object.entries(heatmapData.cell_data).map(([index, intensity]) => ({
                        index,
                        intensity,
                        color: `rgba(239, 68, 68, ${0.1 + intensity * 0.4})`,
                      }))
                    : []
                }
                pickup={
                  (dutyState === 'EN_ROUTE' || dutyState === 'ARRIVED') && riderPin
                    ? riderPin
                    : activeTrip ? { lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lng } : null
                }
                destination={activeTrip ? { lat: activeTrip.dropoff_lat, lng: activeTrip.dropoff_lng } : null}
                routePath={routePath}
                center={activeTrip ? { lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lng } : { lat: 22.5726, lng: 88.3639 }}
                theme="dark"
              />
            </div>
          )}

          {/* Turn-by-Turn Navigation panel */}
          {activeTrip && (dutyState === 'EN_ROUTE' || dutyState === 'DELIVERING') && (
            <button
              type="button"
              onClick={() =>
                openGoogleMapsNavigation(
                  dutyState === 'EN_ROUTE'
                    ? { lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lng }
                    : { lat: activeTrip.dropoff_lat, lng: activeTrip.dropoff_lng },
                )
              }
              className="absolute top-4 left-4 z-20 bg-background-primary/90 border border-border-opaque p-3 rounded-md font-mono text-label-small space-y-1 max-w-xs shadow-elevation-2 text-left animate-enter transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <span className="text-label-small text-content-tertiary uppercase tracking-wider block">Navigation</span>
              <div className="text-content-primary font-medium flex items-center gap-1.5">
                <NavigateIcon size={16} />
                <span>{dutyState === 'EN_ROUTE' ? 'Drive to Pickup' : 'Drive to Dropoff'}</span>
              </div>
              <div className="text-content-secondary truncate">
                {dutyState === 'EN_ROUTE' ? activeTrip.pickup_address : activeTrip.dropoff_address}
              </div>
            </button>
          )}

          {/* Offline overlay */}
          {dutyState === 'OFFLINE' && (
            <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <span className="flex justify-center text-content-secondary"><SignalIcon size={40} /></span>
                <h3 className="text-heading-small text-content-secondary">Terminal Offline</h3>
                <p className="text-paragraph-small text-content-tertiary max-w-xs">
                  Go Online to connect to dispatch and start receiving trip offers.
                </p>
              </div>
            </div>
          )}

          {/* Heatmap toggle */}
          {dutyState !== 'OFFLINE' && (
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <button
                type="button"
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="bg-background-primary/90 border border-border-opaque text-label-small text-content-secondary
                  py-1.5 px-3 rounded-pill hover:bg-background-secondary transition-base flex items-center gap-1.5
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                <FlameIcon size={14} /> {showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
              </button>
              {heatmapData && (
                <div className="bg-background-primary/90 border border-border-opaque text-label-small text-content-tertiary py-1.5 px-3 rounded-pill">
                  {heatmapData.region} · {Object.keys(heatmapData.cell_data).length} cells
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM CONTROL SHEET — leaves room for the tab bar while browsing
            offline; during duty/trips the trip flow owns the bottom edge. */}
        <div className={`mt-auto w-full z-10 bg-background-primary/95 border-t border-border-opaque p-4 sm:p-6 space-y-4 max-w-xl mx-auto rounded-t-lg shadow-elevation-3 backdrop-blur-sm ${
          dutyState === 'OFFLINE' ? 'mb-[calc(3.5rem+env(safe-area-inset-bottom))]' : ''
        }`}>
          {/* Mid-trip wait toggle (round-trip destination wait, billed) */}
          {dutyState === 'DELIVERING' && activeTrip && (
            <button
              onClick={handleToggleWait}
              className={`w-full h-12 rounded-md text-label-medium font-semibold transition-base ${
                isWaiting ? 'bg-interactive-primary text-interactive-primary-text' : 'bg-background-secondary border border-border-opaque text-content-primary'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <PauseIcon size={16} />
                {isWaiting
                  ? `Waiting ${String(Math.floor(waitSeconds / 60)).padStart(2, '0')}:${String(waitSeconds % 60).padStart(2, '0')} — tap to resume`
                  : 'Start waiting (round-trip)'}
              </span>
            </button>
          )}

          {/* In-app chat with the rider (pickup coordination) */}
          {activeTrip && (
            <div className="rounded-md border border-border-opaque bg-background-secondary overflow-hidden">
              <button
                onClick={() => setChatOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-label-medium font-semibold text-content-primary"
              >
                <span className="flex items-center gap-2"><ChatIcon size={18} /> Message rider{chat.length > 0 ? ` (${chat.length})` : ''}</span>
                <span className="text-content-tertiary">{chatOpen ? '▾' : '▸'}</span>
              </button>
              {chatOpen && (
                <div className="px-4 pb-3 space-y-2.5">
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {chat.length === 0 && (
                      <p className="text-label-small text-content-tertiary text-center py-1.5">
                        Coordinate pickup — confirm where the car is parked.
                      </p>
                    )}
                    {chat.map((m, i) => (
                      <div key={i} className={`flex ${m.from === 'DRIVER' ? 'justify-end' : 'justify-start'}`}>
                        <span className={`inline-block max-w-[80%] rounded-md px-3 py-1.5 text-label-small ${
                          m.from === 'DRIVER' ? 'bg-background-inverse text-content-inverse' : 'bg-background-primary text-content-primary border border-border-opaque'
                        }`}>{m.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['On my way', 'Reached the car', 'Where is the car?'].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSendChat(q)}
                        className="rounded-pill border border-border-opaque px-3 py-1 text-label-small text-content-secondary hover:text-content-primary"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleSendChat(chatInput); }} className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message…"
                      maxLength={500}
                      className="flex-1 h-10 px-3 rounded-sm bg-background-primary border border-border-opaque text-label-small text-content-primary focus:outline-none focus:border-border-accent"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="h-10 px-4 rounded-sm bg-background-inverse text-content-inverse text-label-small font-medium disabled:opacity-50"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
          <SentryErrorBoundary name="driver-trip-manager">
          <DriverTripManager
            activeTrip={activeTrip}
            onOpenChat={() => setChatOpen(true)}
            stats={stats}
            profile={profile}
            activeVehicle={activeVehicle}
            setActiveVehicle={setActiveVehicle}
            preferredTripFilter={preferredTripFilter}
            setPreferredTripFilter={setPreferredTripFilter}
            handleToggleDutySwitch={handleToggleDutySwitch}
            logAudit={logAudit}
            triggerSOS={triggerSOS}
            currentPosition={currentPos}
            setShowCancelModal={setShowCancelModal}
            handleArrivedAtPickup={handleArrivedAtPickup}
            freeWaitSeconds={freeWaitSeconds}
            setFreeWaitSeconds={setFreeWaitSeconds}
            waitingCharges={waitingCharges}
            setWaitingCharges={setWaitingCharges}
            otpError={otpError}
            setOtpError={setOtpError}
            startOdometer={startOdometer}
            setStartOdometer={setStartOdometer}
            startFuel={startFuel}
            setStartFuel={setStartFuel}
            startOdoPhoto={startOdoPhoto}
            setStartOdoPhoto={setStartOdoPhoto}
            otpVerificationCode={otpVerificationCode}
            setOtpVerificationCode={setOtpVerificationCode}
            carPlate={carPlate}
            setCarPlate={setCarPlate}
            setDutyState={setDutyState}
            setActiveTrip={setActiveTrip}
            tollCharges={tollCharges}
            parkingCharges={parkingCharges}
            handleTollAddition={handleTollAddition}
            handleParkingAddition={handleParkingAddition}
            endOdometer={endOdometer}
            setEndOdometer={setEndOdometer}
            endFuel={endFuel}
            setEndFuel={setEndFuel}
            endOdoPhoto={endOdoPhoto}
            setEndOdoPhoto={setEndOdoPhoto}
            handleSlideToEndTrip={handleSlideToEndTrip}
          />
          </SentryErrorBoundary>
        </div>
      </main>

      {/* PRIMARY TAB BAR — browsing mode only; the trip flow owns the bottom
          edge once the driver is on duty. */}
      {dutyState === 'OFFLINE' && <TabBar />}

      {/* TELEMETRY LOG CONSOLE */}
      {auditLogs.length > 0 && (
        <div className="w-full bg-background-secondary border-t border-border-opaque p-4 text-left max-w-xl mx-auto z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-label-small text-content-tertiary font-mono uppercase tracking-wider">Telemetry logs</span>
            <button
              onClick={() => setAuditLogs([])}
              className="text-label-small text-content-tertiary hover:text-content-secondary cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              Clear
            </button>
          </div>
          <div className="bg-background-primary border border-border-opaque rounded-sm p-3 max-h-24 overflow-y-auto font-mono text-label-small text-content-tertiary space-y-0.5">
            {auditLogs.map((log, index) => (
              <div key={index} className="truncate select-all leading-relaxed">{log}</div>
            ))}
          </div>
        </div>
      )}

      <footer className="bg-background-primary border-t border-border-opaque p-3 text-center text-label-small font-mono text-content-tertiary select-none">
        VAHNLY · ENCRYPTED WS · TELEMETRY ACTIVE
      </footer>
    </div>
  );
}
