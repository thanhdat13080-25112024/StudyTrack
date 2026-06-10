/**
 * AppShell — the Notion-style application shell that wraps every authenticated
 * page. Desktop (`md+`): a fixed `Sidebar` rail + a scrollable content column.
 * Mobile (`< md`): a `MobileNav` top bar (with a slide-in drawer) over the same
 * content column. The shell owns the canvas, scroll, max-width and padding (the
 * pages no longer carry their own header/layout chrome), and renders the
 * `EmailVerifyBanner` once at the top of the content area.
 */
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/shell/Sidebar';
import { MobileNav } from '@/components/shell/MobileNav';
import { EmailVerifyBanner } from '@/components/EmailVerifyBanner';
import { getMotion } from '@/lib/motion';

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const m = getMotion(useReducedMotion() ?? false);
  return (
    <div className="flex min-h-screen bg-bg-main text-text-main">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="min-h-screen flex-1 overflow-y-auto bg-bg-main">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:px-8">
            <EmailVerifyBanner />
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={m.page}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: m.duration }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
