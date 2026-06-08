import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthForm, type AuthFormValues } from '@/components/auth/AuthForm';
import { useLogin } from '@/features/auth/hooks';
import { ApiError } from '@/lib/apiClient';

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-bg-main p-6">
      <div className="w-full max-w-md rounded-card border border-border bg-bg-card p-8 shadow-card">
        <h1 className="mb-6 text-2xl font-bold text-text-helper">{title}</h1>
        {children}
      </div>
    </main>
  );
}

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
