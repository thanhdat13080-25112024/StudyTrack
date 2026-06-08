import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '@/pages/Login';
import { useVerifyEmail } from '@/features/auth/hooks';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const verify = useVerifyEmail();
  const [status, setStatus] = useState<'pending' | 'ok' | 'fail'>('pending');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    verify.mutate(
      { token },
      { onSuccess: () => setStatus('ok'), onError: () => setStatus('fail') },
    );
  }, [token, verify]);

  return (
    <AuthShell title={t('auth.verifyTitle')}>
      {status === 'pending' && <p className="text-sm text-text-muted">{t('auth.verifying')}</p>}
      {status === 'ok' && <p className="text-sm text-green-400">{t('auth.verifySuccess')}</p>}
      {status === 'fail' && <p className="text-sm text-red-400">{t('auth.verifyInvalid')}</p>}
      <p className="mt-4 text-sm text-text-muted">
        <Link to="/dashboard" className="font-semibold text-accent">
          {t('nav.dashboard')}
        </Link>
      </p>
    </AuthShell>
  );
}
