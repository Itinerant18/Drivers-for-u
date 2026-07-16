import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Persist key — referenced by both the persist middleware (below) and the
// cross-tab logout listener. Keep them in sync: renaming here without updating
// the persist `name` silently disables cross-tab logout.
const AUTH_STORAGE_KEY = 'platform-auth-storage';

/**
 * True when another tab's write to the persisted auth state means "logged out".
 * The persist envelope is `{ state: { token, ... }, version }`, so logout
 * rewrites the key with `token: null` (it is NOT removed) — hence we parse
 * `state.token` rather than checking for an empty newValue.
 */
export function shouldCrossTabLogout(key: string | null, newValue: string | null): boolean {
  if (key !== AUTH_STORAGE_KEY || !newValue) return false;
  try {
    return !JSON.parse(newValue)?.state?.token;
  } catch {
    return false;
  }
}

interface User {
  id: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  name: string;
  phone: string;
  phone_verified?: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  // False until the persist middleware has finished reading localStorage on
  // the client. Guards must wait for this — checking isAuthenticated before
  // rehydration completes always reads the default (false) and bounces an
  // already-logged-in user back to the login screen.
  hasHydrated: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  updateTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
  setPhoneVerified: (verified: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (token, user, refreshToken) =>
        set({ token, user, refreshToken: refreshToken ?? null, isAuthenticated: true }),
      // Swap in a freshly-refreshed access token (and rotated refresh token) without disturbing
      // the user object — called by the request() refresh-on-401 path.
      updateTokens: (token, refreshToken) =>
        set((s) => ({ token, refreshToken: refreshToken ?? s.refreshToken })),
      logout: () => {
        // Purge any session-scoped caches that may hold tokens or PII.
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('onboarding-offline-queue');
          } catch {
            // ignore storage errors
          }
        }
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
      },
      setPhoneVerified: (verified) => {
        set((state) => {
          if (!state.user) return {};
          return {
            user: {
              ...state.user,
              phone_verified: verified,
            },
          };
        });
      },
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: AUTH_STORAGE_KEY, // Persists to localStorage automatically
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Cross-tab logout: when another tab clears the token, drop this tab's session
// too. The `getState().token` guard is load-bearing — driver logout re-persists
// state (firing a fresh storage event in every tab), so without it the tabs
// would cascade logouts endlessly.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (shouldCrossTabLogout(e.key, e.newValue) && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
  });
}
