/**
 * BadgeGrid — 3 achievement badges derived server-side (port of legacy
 * `updateBadgeUI`). Locked badges are greyed/dimmed; unlocked ones get a gold
 * accent ring. Keys: first_session (🌱) / focused_5h (🔥) / master_20h (👑).
 */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Dashboard } from '@/features/sessions/types';

type Badge = Dashboard['badges'][number];

const ICONS: Record<string, string> = {
  first_session: '🌱',
  focused_5h: '🔥',
  master_20h: '👑',
};

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badge) => (
        <div
          key={badge.key}
          className={cn(
            'flex items-center gap-3 rounded-md border p-3 transition-all',
            badge.unlocked
              ? 'border-sticker-orange bg-surface shadow-level-1'
              : 'border-hairline bg-canvas-soft/50 opacity-40 grayscale',
          )}
        >
          <span className="text-2xl" aria-hidden>
            {ICONS[badge.key] ?? '🏅'}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-ink">
              {t(`badges.${badge.key}.title`)}
            </span>
            <span className="text-xs text-ink-muted">{t(`badges.${badge.key}.desc`)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
