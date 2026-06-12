/**
 * BadgeGrid — 3 achievement badges derived server-side (port of legacy
 * `updateBadgeUI`). Locked badges are greyed/dimmed; unlocked ones get an
 * orange sticker ring and a stagger-in pop. Keys: first_session (🌱) /
 * focused_5h (🔥) / master_20h (👑).
 */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion/Reveal';
import type { Dashboard } from '@/features/sessions/types';

type Badge = Dashboard['badges'][number];

const ICONS: Record<string, string> = {
  first_session: '🌱',
  focused_5h: '🔥',
  master_20h: '👑',
};

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const { t } = useTranslation();
  return (
    <Reveal className="flex flex-wrap gap-3">
      {badges.map((badge) => (
        <div
          key={badge.key}
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3 transition-all motion-safe:hover:-translate-y-0.5',
            badge.unlocked
              ? 'border-sticker-orange bg-bg-card'
              : 'border-border bg-bg-main opacity-50 grayscale',
          )}
        >
          <span className="text-2xl" aria-hidden>
            {ICONS[badge.key] ?? '🏅'}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-helper">
              {t(`badges.${badge.key}.title`)}
            </span>
            <span className="text-xs text-text-muted">{t(`badges.${badge.key}.desc`)}</span>
          </div>
        </div>
      ))}
    </Reveal>
  );
}
