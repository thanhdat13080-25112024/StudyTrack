import { motion, useReducedMotion } from 'framer-motion';
import { AuthHero } from '@/components/auth/AuthHero';

/**
 * Two-pane auth layout: a decorative hero band (per-variant background) beside
 * the form card. Switching between /login and /register remounts this shell, so
 * the hero cross-fades and the card slides up on mount — a lightweight page
 * transition, gated on the reduced-motion preference.
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
  const reduced = useReducedMotion() ?? false;
  return (
    <main className="grid min-h-full grid-cols-1 bg-bg-main lg:grid-cols-2">
      {/* Mobile: slim top band. Desktop: full-height left hero. */}
      <motion.div
        className="h-28 lg:h-auto"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.35 }}
      >
        <AuthHero variant={variant} />
      </motion.div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        <motion.div
          className="w-full max-w-md rounded-card border border-border bg-bg-card p-8 shadow-soft"
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: 'easeOut' }}
        >
          <h1 className="mb-6 text-2xl font-bold tracking-heading text-text-main">{title}</h1>
          {children}
        </motion.div>
      </div>
    </main>
  );
}
