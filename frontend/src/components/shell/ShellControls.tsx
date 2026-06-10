/**
 * ShellControls — the bottom cluster of the app-shell: the profile chip (avatar
 * + name → /profile) plus the row of utility controls (notifications, settings,
 * theme toggle, language toggle, logout). Shared verbatim by the desktop
 * Sidebar and the mobile drawer so the control logic lives in one place.
 *
 * The theme/lang handlers come from `useUiStore`; logout reproduces the legacy
 * header behaviour (clear the query cache + redirect to /login).
 */
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Languages, LogOut, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function ShellControls({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useUiStore((s) => s.theme);
  const lang = useUiStore((s) => s.lang);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleLang = useUiStore((s) => s.toggleLang);
  const logout = useAuthStore((s) => s.logout);
  const name = useAuthStore((s) => s.user?.user.name ?? '');
  const avatar = useAuthStore((s) => s.user?.profile.avatar_url ?? null);

  const handleLogout = () => {
    onNavigate?.();
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <Link
        to="/profile"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text-main transition-colors hover:bg-menu-item"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover"
            aria-hidden
          />
        ) : (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent"
            aria-hidden
          >
            {initial}
          </span>
        )}
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{name || t('nav.profile')}</span>
          <span className="truncate text-xs text-text-faint">{t('nav.profile')}</span>
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-1.5">
        <NotificationBell />
        <Button variant="ghost" size="icon" asChild aria-label={t('nav.settings')}>
          <Link to="/settings" onClick={onNavigate}>
            <SettingsIcon className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={t('common.toggleTheme')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden />
          ) : (
            <Moon className="h-4 w-4" aria-hidden />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLang}
          aria-label={t('common.toggleLanguage')}
        >
          <Languages className="h-4 w-4" aria-hidden />
          {lang.toUpperCase()}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t('common.logout')}>
          <LogOut className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
