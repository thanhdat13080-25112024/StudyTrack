import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR, EASE, Y } from '@/lib/motion';
import { AuthHero } from '@/components/auth/AuthHero';

/**
 * Two-pane auth layout: a decorative hero band (per-variant background) beside
 * the form card. Switching between /login and /register remounts this shell, so
 * the hero cross-fades and the card rises on mount — a lightweight page
 * transition. Reduced motion renders the final state instantly (gsap.matchMedia).
 */
export function AuthShell({
  title,
  variant = 'login',
  children,
}: {
  title: string;
  variant?: 'login' | 'register';
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(root.querySelector('[data-hero]'), {
          opacity: 0,
          duration: DUR.base,
          ease: EASE.soft,
        });
        gsap.from(root.querySelector('[data-card]'), {
          opacity: 0,
          y: Y,
          duration: DUR.base,
          ease: EASE.standard,
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <main ref={rootRef} className="grid min-h-full grid-cols-1 bg-bg-main lg:grid-cols-2">
      {/* Mobile: slim top band. Desktop: full-height left hero. */}
      <div data-hero className="h-28 lg:h-auto">
        <AuthHero variant={variant} />
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div
          data-card
          className="w-full max-w-md rounded-card border border-border bg-bg-card p-8 shadow-soft"
        >
          <h1 className="mb-6 text-2xl font-bold tracking-heading text-text-main">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
