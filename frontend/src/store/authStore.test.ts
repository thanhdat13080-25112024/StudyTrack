import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { TOKEN_STORAGE_KEY } from '@/lib/apiClient';

describe('authStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ token: null, user: null });
  });

  it('setSession stores the token in localStorage and marks authenticated', () => {
    useAuthStore.getState().setSession('jwt-abc');
    expect(useAuthStore.getState().token).toBe('jwt-abc');
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-abc');
  });

  it('logout clears token + user from store and localStorage', () => {
    useAuthStore.getState().setSession('jwt-abc');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
