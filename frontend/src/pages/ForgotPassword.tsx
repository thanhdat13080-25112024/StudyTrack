import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/features/auth/hooks';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate({ email }, { onSettled: () => setSent(true) });
  };

  return (
    <AuthShell title={t('auth.forgotTitle')}>
      {sent ? (
        <p className="text-sm text-text-muted">{t('auth.forgotSent')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={forgot.isPending}>
            {t('auth.forgotSubmit')}
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
