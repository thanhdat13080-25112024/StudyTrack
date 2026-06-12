/**
 * Sidebar — the fixed desktop rail (Notion-style). Wordmark at the top, the
 * grouped `SidebarNav` scrolls in the middle, and the `ShellControls` cluster
 * (profile + utilities) is pinned to the bottom. Hidden below `md` (the mobile
 * drawer in MobileNav takes over there).
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SidebarNav } from '@/components/shell/SidebarNav';
import { ShellControls } from '@/components/shell/ShellControls';
import { NotificationBell } from '@/components/NotificationBell';

export function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-bg-sidebar md:flex">
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight text-accent">
          {t('app.name')}
        </Link>
        <NotificationBell align="left" />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <SidebarNav />
      </div>
      <div className="px-2 pb-4">
        <ShellControls />
      </div>
    </aside>
  );
}
