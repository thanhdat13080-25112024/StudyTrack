import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useResendVerification } from '@/features/auth/hooks';

/**
 * Soft email-verification gate. Renders a dismissible-style notice with a
 * "resend" action only while the current user's email is unverified; returns
 * null once verified (or while the user is unknown — assume verified to avoid
 * a flash). Mounted in the authenticated shell.
 */
export function EmailVerifyBanner() {
  const { t } = useTranslation();
  const verified = useAuthStore((s) => s.user?.user.email_verified ?? true);
  const resend = useResendVerification();
  if (verified) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-token border border-border bg-bg-card px-4 py-2 text-sm text-text-main">
      <span>{t('auth.verifyBanner')}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={resend.isPending}
        onClick={() => resend.mutate()}
      >
        {t('auth.verifyResend')}
      </Button>
    </div>
  );
}
