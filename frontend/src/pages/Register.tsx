import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthForm, type AuthFormValues } from '@/components/auth/AuthForm';
import { AuthShell } from '@/components/auth/AuthShell';
import { useRegister } from '@/features/auth/hooks';
import { ApiError } from '@/lib/apiClient';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMut = useRegister();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (values: AuthFormValues) => {
    setError(null);
    registerMut.mutate(
      { email: values.email, password: values.password, name: values.name ?? '' },
      {
        onSuccess: () => navigate('/dashboard', { replace: true }),
        onError: (e) => setError(e instanceof ApiError ? e.message : t('auth.genericError')),
      },
    );
  };

  return (
    <AuthShell title={t('auth.registerTitle')}>
      <AuthForm mode="register" pending={registerMut.isPending} error={error} onSubmit={onSubmit} />
      <p className="mt-4 text-sm text-text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-accent">
          {t('auth.login')}
        </Link>
      </p>
    </AuthShell>
  );
}
