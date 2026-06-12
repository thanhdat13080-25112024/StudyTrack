import { useEffect, useState } from 'react';

// ── Motion tokens (personality B — Smooth & Fluid) ───────────────────────────
// Single source of truth for the GSAP motion system: retune the whole app from
// here. No back/elastic eases in app chrome (the auth-hero sticker pop is the
// one allowed decorative overshoot). Consumed by the motion primitives
// (components/motion/*) and component-level useGSAP timelines.
export const DUR = { fast: 0.28, base: 0.45, slow: 0.6 } as const;
export const EASE = { standard: 'power3.out', soft: 'power2.inOut', count: 'power2.out' } as const;
export const STAGGER = 0.08;
export const Y = 16; // entrance slide distance, px
export const REVEAL_START = 'top 85%'; // ScrollTrigger start for scroll reveals

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Reactive boolean for the OS reduced-motion preference. For NON-animation
 * logic (e.g. instant vs smooth scroll, skipping a count-up). Animation
 * primitives gate themselves via gsap.matchMedia() on the same query.
 */
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
