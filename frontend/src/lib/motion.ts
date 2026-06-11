import type { Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

// Page-level route transition is a pure cross-fade (no y-shift): the per-page
// list staggers (listItem) own the slide-up motion, so keeping the page wrapper
// to opacity-only avoids a second, duplicated slide on every navigation.
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
export const listStagger: Variants = {
  animate: { transition: { staggerChildren: 0.04 } },
};
export const listItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

/** Gate all motion on the reduced-motion preference. */
export function getMotion(reduced: boolean) {
  if (reduced) {
    return {
      duration: 0,
      page: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      } as Variants,
      list: {} as Variants,
      item: { initial: { opacity: 1 }, animate: { opacity: 1 } } as Variants,
    };
  }
  return { duration: 0.22, page: pageVariants, list: listStagger, item: listItem };
}

// ── GSAP motion tokens (personality B — Smooth & Fluid) ──────────────────────
// Single source of truth for the GSAP migration; retune the whole app here.
// No back/elastic eases. (The framer `getMotion`/variants above are a temporary
// shim kept until every call-site is migrated off them, then removed.)
export const DUR = { fast: 0.28, base: 0.45, slow: 0.6 } as const;
export const EASE = { standard: 'power3.out', soft: 'power2.inOut', count: 'power2.out' } as const;
export const STAGGER = 0.08;
export const Y = 16; // entrance slide distance, px
export const REVEAL_START = 'top 85%'; // ScrollTrigger start for scroll reveals

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/** Reactive boolean for the OS reduced-motion preference. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
