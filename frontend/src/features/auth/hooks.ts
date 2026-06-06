/** TanStack Query hooks for auth + profile. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { applyTheme, type Theme } from '@/lib/theme';
import { setLanguage, type Lang } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import type {
  MeOut,
  ProfileOut,
  ProfileUpdate,
  Token,
  UserOut,
  UserSettingsUpdate,
} from './types';

export const ME_KEY = ['auth', 'me'] as const;

/** Apply server-stored lang/theme to the client (cross-device sync). */
function applyServerPrefs(user: UserOut): void {
  applyTheme(user.theme as Theme);
  setLanguage(user.lang as Lang);
}

export function useMe() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ME_KEY,
    enabled: token !== null,
    queryFn: async () => {
      const me = await apiClient.get<MeOut>('/api/auth/me');
      setUser(me);
      applyServerPrefs(me.user);
      return me;
    },
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      apiClient.postForm<Token>('/api/auth/login', {
        username: vars.email,
        password: vars.password,
      }),
    onSuccess: (token) => {
      setSession(token.access_token);
      void qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string; name: string }) =>
      apiClient.post<Token>('/api/auth/register', vars),
    onSuccess: (token) => {
      setSession(token.access_token);
      void qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) => apiClient.put<ProfileOut>('/api/profile', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserSettingsUpdate) => apiClient.patch<UserOut>('/api/auth/me', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}
