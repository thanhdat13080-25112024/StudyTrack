import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR, EASE, REVEAL_START, STAGGER, Y } from '@/lib/motion';

interface RevealProps {
  /** Wrapper element tag. Default 'div'. */
  as?: ElementType;
  /** Reveal direct children as they scroll into view (once) instead of on mount. */
  scroll?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Staggers its DIRECT children in from { opacity: 0, y: 16 } (personality B —
 * Smooth & Fluid). `scroll` wires a one-shot ScrollTrigger; otherwise it plays
 * on mount. Under reduced motion no tween is added, so children render in their
 * final state immediately. Replaces framer's listStagger/listItem variants.
 */
export function Reveal({ as, scroll = false, className, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Comp = (as ?? 'div') as ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(el.children, {
          opacity: 0,
          y: Y,
          duration: DUR.base,
          ease: EASE.standard,
          stagger: STAGGER,
          // The app shell's <main data-scroll-root> is the real scroll container
          // (the window never scrolls inside the shell) — point ScrollTrigger at
          // it; outside the shell fall back to the window default.
          ...(scroll
            ? {
                scrollTrigger: {
                  trigger: el,
                  start: REVEAL_START,
                  once: true,
                  scroller: el.closest('[data-scroll-root]') ?? undefined,
                },
              }
            : {}),
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Comp ref={ref as React.Ref<HTMLElement>} className={className}>
      {children}
    </Comp>
  );
}
