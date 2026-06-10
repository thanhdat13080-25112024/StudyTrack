import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Flame, GraduationCap, Timer } from 'lucide-react';

// Decorative sticker constellation: fixed positions + sticker colors.
const STICKERS = [
  { Icon: Timer, color: '#62aef0', top: '18%', left: '12%' },
  { Icon: Flame, color: '#ff64c8', top: '30%', left: '64%' },
  { Icon: GraduationCap, color: '#1aae39', top: '62%', left: '20%' },
  { Icon: BookOpen, color: '#d6b6f6', top: '72%', left: '70%' },
];

export function AuthHero() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-secondary p-10 text-white">
      <span className="text-lg font-bold tracking-heading">{t('app.name')}</span>
      <div className="relative">
        <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-display">
          {t('app.tagline')}
        </h2>
      </div>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {STICKERS.map(({ Icon, color, top, left }, i) => (
          <motion.span
            key={i}
            className="absolute inline-flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ top, left, backgroundColor: `${color}26`, color }}
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduced ? undefined : { delay: 0.1 * i, duration: 0.4 }}
          >
            <Icon className="h-6 w-6" />
          </motion.span>
        ))}
      </div>
    </div>
  );
}
