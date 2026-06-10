/** Bell with unread-count badge + dropdown of recent notifications. Localizes
 * server notifications from their `type` + `payload`. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notifications/hooks';
import type { Notification } from '@/features/notifications/types';

function renderText(
  t: (k: string, o?: Record<string, unknown>) => string,
  n: Notification,
): string {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  if (n.type === 'deadline_reminder') {
    return t('notifications.deadlineReminder', { title: String(p.title ?? '') });
  }
  if (n.type === 'badge_unlocked') {
    return t('notifications.badgeUnlocked', {
      badge: t(`badges.${String(p.badge_key ?? '')}.title`),
    });
  }
  return n.type;
}

export function NotificationBell() {
  const { t } = useTranslation();
  const { data: unread } = useUnreadCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const [open, setOpen] = useState(false);
  const count = unread?.count ?? 0;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notifications.title')}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {count > 0 && (
          <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-white">{count}</span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-border bg-bg-card p-2 shadow-elevated">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="font-semibold text-text-main">{t('notifications.title')}</span>
            <button className="text-xs text-accent" onClick={() => markAll.mutate()}>
              {t('notifications.markAllRead')}
            </button>
          </div>
          {(notifications ?? []).length === 0 && (
            <p className="px-2 py-3 text-sm text-text-muted">{t('notifications.empty')}</p>
          )}
          {(notifications ?? []).slice(0, 10).map((n) => (
            <button
              key={n.id}
              onClick={() => markRead.mutate(n.id)}
              className={`block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-menu-item ${
                n.read ? 'text-text-muted' : 'text-text-main'
              }`}
            >
              {renderText(t, n)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
