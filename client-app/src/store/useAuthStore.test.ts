import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, shouldCrossTabLogout } from './useAuthStore';

const user = { id: 'd1', role: 'DRIVER' as const, name: 'Dee', phone: '+919876543210' };

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  localStorage.clear();
});

describe('useAuthStore (driver)', () => {
  it('login stores token, user, and flips isAuthenticated', () => {
    useAuthStore.getState().login('jwt-token', user);
    const s = useAuthStore.getState();
    expect(s.token).toBe('jwt-token');
    expect(s.user).toEqual(user);
    expect(s.isAuthenticated).toBe(true);
  });

  it('logout clears the whole auth state', () => {
    useAuthStore.getState().login('jwt-token', user);
    useAuthStore.getState().logout();
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it('persists the token to localStorage (survives a reload)', () => {
    useAuthStore.getState().login('persist-me', user);
    expect(localStorage.getItem('platform-auth-storage')).toContain('persist-me');
  });
});

describe('shouldCrossTabLogout', () => {
  const key = 'platform-auth-storage';
  it('fires on a cross-tab logout (token nulled in the persist envelope)', () => {
    expect(shouldCrossTabLogout(key, JSON.stringify({ state: { token: null }, version: 0 }))).toBe(true);
  });
  it('does NOT fire on a cross-tab login (token present)', () => {
    expect(shouldCrossTabLogout(key, JSON.stringify({ state: { token: 'x' }, version: 0 }))).toBe(false);
  });
  it('ignores other keys and empty / malformed values', () => {
    expect(shouldCrossTabLogout('other-key', JSON.stringify({ state: { token: null } }))).toBe(false);
    expect(shouldCrossTabLogout(key, null)).toBe(false);
    expect(shouldCrossTabLogout(key, 'not json')).toBe(false);
  });
});
