import { useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR, EASE } from '@/lib/motion';

/**
 * Enter-only route transition: fades + rises the routed content in on each
 * pathname change. Replaces framer's <AnimatePresence mode="wait"> wrapper
 * (the old transition was opacity-only, so dropping the exit is faithful).
 * No-ops under reduced motion.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(ref.current, { opacity: 0, y: 8, duration: DUR.fast, ease: EASE.standard });
      });
      return () => mm.revert();
    },
    { dependencies: [pathname], scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
