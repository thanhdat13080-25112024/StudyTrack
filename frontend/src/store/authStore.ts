/**
 * Auth store — token + current user (Zustand). Token persists to localStorage
 * via apiClient's setToken/getToken. On login the server-stored lang/theme are
 * applied (cross-device sync); see features/auth/hooks.ts useMe.
 */
import { create } from 'zustand';
import { getToken, setToken } from '@/lib/apiClient';
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
  token: getToken(),
  user: null,
  setSession: (token) => {
    setToken(token);
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    setToken(null);
    set({ token: null, user: null });
  },
  isAuthenticated: () => get().token !== null,
}));
