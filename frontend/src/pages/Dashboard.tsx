import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Languages, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Phase 0 smoke page, extended in Phase 1 with profile navigation + logout.
 * Real dashboard (KPIs, chart, badges, calendar) arrives in a later phase.
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useUiStore((s) => s.theme);
  const lang = useUiStore((s) => s.lang);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleLang = useUiStore((s) => s.toggleLang);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <main className="min-h-full bg-bg-main text-text-main">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="flex items-center justify-between">
          <span className="text-2xl font-bold text-accent">{t('app.name')}</span>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/profile">
                <UserRound className="h-4 w-4" aria-hidden />
                {t('nav.profile')}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={toggleLang}>
              <Languages className="h-4 w-4" aria-hidden />
              {lang.toUpperCase()}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              aria-label={t('common.toggleTheme')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
              {t('common.logout')}
            </Button>
          </div>
        </header>

        <section className="rounded-card border border-border bg-bg-card p-8 shadow-card">
          <h1 className="text-text-helper text-sm font-semibold uppercase tracking-wide">
            {t('app.tagline')}
          </h1>
          <p className="mt-3 text-lg text-text-main">{t('common.welcome')} 👋</p>
          <p className="mt-2 text-text-helper">{t('dashboard.welcomeLine')}</p>
        </section>
      </div>
    </main>
  );
}
