/** TanStack Query hooks for auth + profile. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Theme } from '@/lib/theme';
import type { Lang } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import type {
  AccountExport,
  ChangePasswordIn,
  DeleteAccountIn,
  ForgotPasswordIn,
  MeOut,
  ProfileOut,
  ProfileUpdate,
  ResetPasswordIn,
  Token,
  UserOut,
  UserSettingsUpdate,
  VerifyEmailIn,
} from './types';

export const ME_KEY = ['auth', 'me'] as const;

/** Adopt server-stored lang/theme into the UI store (cross-device sync, no echo). */
function applyServerPrefs(user: UserOut): void {
  useUiStore.getState().hydrate(user.lang as Lang, user.theme as Theme);
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

/** Request a password-reset link. Always resolves (server returns 204). */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordIn) => apiClient.post<void>('/api/auth/forgot-password', data),
  });
}

/** Set a new password using a reset token from the email link. */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordIn) => apiClient.post<void>('/api/auth/reset-password', data),
  });
}

/** Verify an email address using a token from the verification link. */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailIn) => apiClient.post<void>('/api/auth/verify-email', data),
  });
}

/** Resend the verification email to the current (authenticated) user. */
export function useResendVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<void>('/api/auth/resend-verification'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}

/** Change the current user's password (requires the current password). */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordIn) => apiClient.post<void>('/api/auth/change-password', data),
  });
}

/** Delete the current account (password-confirmed); clears the session on success. */
export function useDeleteAccount() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DeleteAccountIn) => apiClient.delete<void>('/api/auth/me', { json: data }),
    onSuccess: () => {
      logout();
      qc.clear();
    },
  });
}

/** Download a full export of the current user's data. */
export function useExportData() {
  return useMutation({
    mutationFn: () => apiClient.get<AccountExport>('/api/auth/me/export'),
  });
}
