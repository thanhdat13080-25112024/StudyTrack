/**
 * SidebarNav — the grouped primary navigation, shared by the desktop rail and
 * the mobile drawer. Single source of truth for destinations is `lib/nav`'s
 * `NAV_GROUPS`; this component only renders them. The active row (matched by
 * `location.pathname`) gets `aria-current="page"`, a filled menu background, and
 * a 2px accent left-indicator. Motion is gated on the reduced-motion preference.
 */
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { NAV_GROUPS } from '@/lib/nav';
import { getMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const reduced = useReducedMotion() ?? false;
  const motionCfg = getMotion(reduced);

  return (
    <motion.nav
      className="flex flex-col gap-6"
      variants={motionCfg.list}
      initial="initial"
      animate="animate"
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.key} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-eyebrow text-text-faint">
            {t(group.key)}
          </p>
          {group.items.map(({ to, key, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <motion.div key={to} variants={motionCfg.item}>
                <Link
                  to={to}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-accent bg-menu-item font-medium text-menu-item-text'
                      : 'border-transparent text-text-helper hover:bg-menu-item',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{t(key)}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.nav>
  );
}
