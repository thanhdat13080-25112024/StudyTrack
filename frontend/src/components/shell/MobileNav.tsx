/**
 * MobileNav — the `< md` chrome. A slim sticky top bar (hamburger + wordmark +
 * notification bell) that opens an off-canvas drawer sliding in from the left.
 * The drawer reuses `SidebarNav` + `ShellControls` so navigation/controls match
 * the desktop rail exactly. Backdrop click, Escape, and selecting a nav link all
 * close it. Slide motion is gated on the reduced-motion preference.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR, EASE, usePrefersReducedMotion } from '@/lib/motion';
import { usePresence } from '@/hooks/usePresence';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { SidebarNav } from '@/components/shell/SidebarNav';
import { ShellControls } from '@/components/shell/ShellControls';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function MobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { rendered, onExited } = usePresence(open);
  const overlayRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  // Trap focus inside the drawer and lock body scroll while it's open; focus
  // returns to the hamburger trigger on close (handled by the hook).
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Enter/exit timeline for backdrop + panel. Exit must finish before unmount,
  // so the close branch calls onExited() when the timeline completes (instantly
  // under reduced motion).
  useGSAP(
    () => {
      const root = overlayRef.current;
      if (!root || !rendered) return;
      const backdrop = root.querySelector('[data-backdrop]');
      const panel = root.querySelector('[data-panel]');
      if (open) {
        if (reduced) {
          gsap.set(backdrop, { opacity: 1 });
          gsap.set(panel, { xPercent: 0 });
          return;
        }
        gsap
          .timeline()
          .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: DUR.fast })
          .fromTo(
            panel,
            { xPercent: -100 },
            { xPercent: 0, duration: DUR.base, ease: EASE.standard },
            '<',
          );
      } else {
        if (reduced) {
          onExited();
          return;
        }
        gsap
          .timeline({ onComplete: onExited })
          .to(backdrop, { opacity: 0, duration: DUR.fast })
          .to(panel, { xPercent: -100, duration: DUR.base, ease: EASE.soft }, '<');
      }
    },
    { dependencies: [open, rendered, reduced], scope: overlayRef },
  );

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
          <NotificationBell />
        </div>
      </header>

      {rendered && (
        <div ref={overlayRef}>
          <div
            data-backdrop
            className="fixed inset-0 z-40 bg-black/40"
            onClick={close}
            aria-hidden
          />
          <div
            data-panel
            ref={drawerRef}
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-bg-sidebar shadow-elevated focus:outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                to="/dashboard"
                onClick={close}
                className="text-lg font-bold tracking-tight text-accent"
              >
                {t('app.name')}
              </Link>
              <Button variant="ghost" size="icon" onClick={close} aria-label={t('nav.closeMenu')}>
                <X className="h-5 w-5" aria-hidden />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
              <SidebarNav onNavigate={close} />
            </div>
            <div className="px-2 pb-4">
              <ShellControls onNavigate={close} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
