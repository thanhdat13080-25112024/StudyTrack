/**
 * Auth store — token + current user (Zustand). Token persists to localStorage
 * via apiClient's setToken/getToken. On login the server-stored lang/theme are
 * applied (cross-device sync); see features/auth/hooks.ts useMe.
 */
import { create } from 'zustand';
import { getToken, setToken } from '@/lib/apiClient';
import { PREVIEW_MODE, PREVIEW_TOKEN } from '@/lib/previewMode';
import type { MeOut } from '@/features/auth/types';

interface AuthState {
  token: string | null;
  user: MeOut | null;
  setSession: (token: string) => void;
  setUser: (me: MeOut | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Preview mode seeds a synthetic token so the app treats the visitor as signed
  // in (no real login / backend); apiClient serves demo fixtures. See previewMode.
  token: PREVIEW_MODE ? PREVIEW_TOKEN : getToken(),
  user: null,
  setSession: (token) => {
    setToken(token);
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    if (PREVIEW_MODE) return; // no real session to end in preview; avoids a dead-end /login
    setToken(null);
    set({ token: null, user: null });
  },
  isAuthenticated: () => get().token !== null,
}));
