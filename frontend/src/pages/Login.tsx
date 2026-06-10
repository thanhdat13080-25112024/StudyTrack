import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthForm, type AuthFormValues } from '@/components/auth/AuthForm';
import { AuthShell } from '@/components/auth/AuthShell';
import { useLogin } from '@/features/auth/hooks';
import { ApiError } from '@/lib/apiClient';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (values: AuthFormValues) => {
    setError(null);
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => navigate('/dashboard', { replace: true }),
        onError: (e) => setError(e instanceof ApiError ? e.message : t('auth.genericError')),
      },
    );
  };

  return (
    <AuthShell title={t('auth.loginTitle')}>
      <AuthForm mode="login" pending={login.isPending} error={error} onSubmit={onSubmit} />
      <p className="mt-2 text-sm">
        <Link to="/forgot-password" className="text-accent">
          {t('auth.forgotPassword')}
        </Link>
      </p>
      <p className="mt-4 text-sm text-text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-accent">
          {t('auth.register')}
        </Link>
      </p>
    </AuthShell>
  );
}
