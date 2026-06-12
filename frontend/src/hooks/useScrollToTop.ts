import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrefersReducedMotion } from '@/lib/motion';

/**
 * Reset a scroll container to the top whenever the route (pathname) changes.
 *
 * Route transitions happen inside the AppShell (the sidebar persists, only the
 * main content swaps), so the browser never resets scroll on navigation. This
 * scrolls the given container back to the top so a fresh page never opens
 * mid-scroll. Smooth scroll is gated behind the reduced-motion preference;
 * reduced-motion users get an instant jump.
 */
export function useScrollToTop(ref: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: 0, left: 0, behavior: reduced ? 'auto' : 'smooth' });
  }, [pathname, reduced, ref]);
}
