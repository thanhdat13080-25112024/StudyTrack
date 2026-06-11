/**
 * AppShell — the Notion-style application shell that wraps every authenticated
 * page. Desktop (`md+`): a fixed `Sidebar` rail + a scrollable content column.
 * Mobile (`< md`): a `MobileNav` top bar (with a slide-in drawer) over the same
 * content column. The shell owns the canvas, scroll, max-width and padding (the
 * pages no longer carry their own header/layout chrome), and renders the
 * `EmailVerifyBanner` once at the top of the content area.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/shell/Sidebar';
import { MobileNav } from '@/components/shell/MobileNav';
import { EmailVerifyBanner } from '@/components/EmailVerifyBanner';
import { CommandPalette } from '@/components/command/CommandPalette';
import { ShortcutHelp } from '@/components/command/ShortcutHelp';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PageTransition } from '@/components/motion/PageTransition';

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // The <main> column is the only scroll container (sidebar persists), so reset
  // it to the top on each route change — see useScrollToTop.
  const mainRef = useRef<HTMLElement>(null);
  useScrollToTop(mainRef);

  useGlobalShortcuts({
    openPalette: () => setPaletteOpen((o) => !o),
    openHelp: () => setHelpOpen(true),
    closeAll: () => {
      setPaletteOpen(false);
      setHelpOpen(false);
    },
  });

  return (
    <div className="flex min-h-screen bg-bg-main text-text-main">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main ref={mainRef} className="min-h-screen flex-1 overflow-y-auto bg-bg-main">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:px-8">
            <EmailVerifyBanner />
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
