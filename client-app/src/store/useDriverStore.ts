/**
 * useDriverStore — Adapter for redesigned components.
 *
 * The new HomeOrchestrator and Home screens expect a richer interface than the
 * legacy useDriverDutyStore provides. This store wraps the duty store and adds
 * the extra state (connection status, GPS, cooldown, stats, filter) that the
 * new components need.
 *
 * Once the migration is complete, merge everything into a single store.
 */

import { create } from 'zustand';
import { useDriverDutyStore, DutyState } from './useDriverDutyStore';
import { setDriverDutyState } from '@/api/client';
import { useAuthStore } from './useAuthStore';

type ConnectionStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
type TripFilter = 'ALL' | 'CITY' | 'OUTSTATION';

interface DriverStats {
  todayJobs: number;
  todayEarnings: number;
  onlineHours: number;
  acceptanceRate: number;
  rating: number;
}

interface DriverStoreState {
  // Derived from useDriverDutyStore.state
  status: 'OFFLINE' | 'ONLINE';
  connectionStatus: ConnectionStatus;
  gpsError: string | null;
  cooldownSecs: number;
  tripFilter: TripFilter;
  stats: DriverStats;

  // Actions
  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
  reconnect: () => void;
  setTripFilter: (f: TripFilter) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  setGpsError: (err: string | null) => void;
  setCooldown: (secs: number) => void;
  updateStats: (partial: Partial<DriverStats>) => void;
}

export const useDriverStore = create<DriverStoreState>((set, get) => ({
  status: 'OFFLINE',
  connectionStatus: 'DISCONNECTED',
  gpsError: null,
  cooldownSecs: 0,
  tripFilter: 'ALL',
  stats: {
    todayJobs: 0,
    todayEarnings: 0,
    onlineHours: 0,
    acceptanceRate: 100,
    rating: 4.85,
  },

  goOnline: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    // Get current position for the API call
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      await setDriverDutyState(token, 'ONLINE', pos.coords.latitude, pos.coords.longitude);
      useDriverDutyStore.getState().setDutyState('ONLINE');
      set({ status: 'ONLINE', connectionStatus: 'CONNECTED', gpsError: null });
    } catch (err) {
      set({ gpsError: 'Unable to get GPS location. Please enable location services.' });
    }
  },

  goOffline: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await setDriverDutyState(token, 'OFFLINE');
      useDriverDutyStore.getState().setDutyState('OFFLINE');
      set({ status: 'OFFLINE', connectionStatus: 'DISCONNECTED' });
    } catch (err) {
      // Force local state anyway
      set({ status: 'OFFLINE' });
    }
  },

  reconnect: () => {
    set({ connectionStatus: 'RECONNECTING' });
    // The WebSocket manager will handle actual reconnection
    // This just signals intent; actual status updated via setConnectionStatus
  },

  setTripFilter: (f) => set({ tripFilter: f }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
  setGpsError: (err) => set({ gpsError: err }),
  setCooldown: (secs) => set({ cooldownSecs: secs }),
  updateStats: (partial) => set((state) => ({ stats: { ...state.stats, ...partial } })),
}));
