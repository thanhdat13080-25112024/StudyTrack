import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/features/auth/hooks';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const reset = useResetPassword();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    reset.mutate(
      { token, new_password: password },
      { onSuccess: () => setDone(true), onError: () => setError(t('auth.resetInvalid')) },
    );
  };

  return (
    <AuthShell title={t('auth.resetTitle')}>
      {done ? (
        <p className="text-sm text-text-muted">{t('auth.resetSuccess')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newpass">{t('auth.newPassword')}</Label>
            <Input
              id="newpass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <span className="text-sm text-red-400">{error}</span>}
          <Button type="submit" disabled={reset.isPending}>
            {t('auth.resetSubmit')}
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-text-muted">
        <Link to="/login" className="font-semibold text-accent">
          {t('auth.login')}
        </Link>
      </p>
    </AuthShell>
  );
}
