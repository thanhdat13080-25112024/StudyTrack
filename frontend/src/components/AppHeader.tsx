/**
 * Shared app header — app name + primary nav (Dashboard / Focus / History /
 * Schedule) + lang/theme/profile/logout controls. Reused across the
 * authenticated pages so the chrome is consistent (extracted from the Phase-1
 * Dashboard header).
 */
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  History,
  Languages,
  LayoutDashboard,
  LogOut,
  Moon,
  Route,
  Settings as SettingsIcon,
  Sun,
  Timer as TimerIcon,
  UserRound,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

const NAV = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/focus', key: 'nav.focus', icon: TimerIcon },
  { to: '/history', key: 'nav.history', icon: History },
  { to: '/schedule', key: 'nav.schedule', icon: CalendarDays },
  { to: '/courses', key: 'nav.courses', icon: BookOpen },
  { to: '/grades', key: 'nav.grades', icon: GraduationCap },
  { to: '/roadmap', key: 'nav.roadmap', icon: Route },
  { to: '/analysis', key: 'nav.analysis', icon: Activity },
  { to: '/analytics', key: 'nav.analytics', icon: BarChart3 },
  { to: '/deadlines', key: 'nav.deadlines', icon: CalendarClock },
] as const;

export function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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
    <header className="flex flex-col gap-4 border-b border-hairline bg-canvas px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-2xl font-bold text-primary">
          {t('app.name')}
        </Link>
        <nav className="flex flex-wrap gap-1">
          {NAV.map(({ to, key, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-hairline text-ink'
                    : 'text-ink-secondary hover:bg-canvas-soft hover:text-ink',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(key)}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-wrap gap-2">
        <NotificationBell />
        <Button variant="ghost" size="sm" asChild className="rounded-md">
          <Link to="/profile">
            <UserRound className="h-4 w-4" aria-hidden />
            {t('nav.profile')}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="rounded-md">
          <Link to="/settings">
            <SettingsIcon className="h-4 w-4" aria-hidden />
            {t('nav.settings')}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleLang} className="rounded-md">
          <Languages className="h-4 w-4" aria-hidden />
          {lang.toUpperCase()}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="rounded-md"
          aria-label={t('common.toggleTheme')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden />
          ) : (
            <Moon className="h-4 w-4" aria-hidden />
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-md">
          <LogOut className="h-4 w-4" aria-hidden />
          {t('common.logout')}
        </Button>
      </div>
    </header>
  );
}
