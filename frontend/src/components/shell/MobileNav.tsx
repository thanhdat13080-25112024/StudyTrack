/**
 * MobileNav — the `< md` chrome. A slim sticky top bar (hamburger + wordmark +
 * notification bell) that opens an off-canvas drawer sliding in from the left.
 * The drawer reuses `SidebarNav` + `ShellControls` so navigation/controls match
 * the desktop rail exactly. Backdrop click, Escape, and selecting a nav link all
 * close it. Slide motion is gated on the reduced-motion preference.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { SidebarNav } from '@/components/shell/SidebarNav';
import { ShellControls } from '@/components/shell/ShellControls';
import { ShellBoundary } from '@/components/shell/ShellBoundary';
import { getMotion } from '@/lib/motion';

export function MobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const duration = getMotion(reduced).duration;
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg-sidebar px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label={t('nav.openMenu')}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
        <Link to="/dashboard" className="text-lg font-bold tracking-tight text-accent">
          {t('app.name')}
        </Link>
        <div className="ml-auto">
          <ShellBoundary>
            <NotificationBell />
          </ShellBoundary>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration }}
              onClick={close}
              aria-hidden
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-bg-sidebar shadow-elevated"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-4 py-4">
                <Link
                  to="/dashboard"
                  onClick={close}
                  className="text-lg font-bold tracking-tight text-accent"
                >
                  {t('app.name')}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={close}
                  aria-label={t('nav.closeMenu')}
                >
                  <X className="h-5 w-5" aria-hidden />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                <SidebarNav onNavigate={close} />
              </div>
              <div className="px-2 pb-4">
                <ShellBoundary>
                  <ShellControls onNavigate={close} />
                </ShellBoundary>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
