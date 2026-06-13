/**
 * useGlobalShortcuts — the window-level keyboard listener that drives the
 * Phase C keyboard layer. Mounted once in `AppShell`.
 *
 * Behaviour (keymap lives in `lib/shortcuts`):
 *  - ⌘K / Ctrl-K toggles the palette, even while typing (it carries a modifier).
 *  - Otherwise, when focus is in a text-entry target, every bare key is ignored.
 *  - Bare keys feed `resolveKey` with a pending ref (the `g`-combo leader) that
 *    auto-resets after ~1.2s, then dispatch via react-router / the UI store.
 *
 * Not unit-tested directly (DOM/event timing) — the pure `resolveKey`/
 * `contextualNew`/`isTypingTarget` logic is covered by `shortcuts.test.ts` and
 * the palette has its own integration test; this wiring is verified manually
 * across the vi/en × light/dark matrix.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { contextualNew, isTypingTarget, resolveKey } from '@/lib/shortcuts';
import { toggleThemeWithReveal } from '@/lib/themeReveal';

const PENDING_RESET_MS = 1200;

export interface UseGlobalShortcutsArgs {
  /** Toggle the command palette open/closed. */
  openPalette: () => void;
  /** Open the keyboard-shortcut help overlay. */
  openHelp: () => void;
  /** Close every shell-owned overlay (palette + help). */
  closeAll: () => void;
}

export function useGlobalShortcuts({ openPalette, openHelp, closeAll }: UseGlobalShortcutsArgs) {
  const navigate = useNavigate();
  const location = useLocation();
  const toggleLang = useUiStore((s) => s.toggleLang);

  // Keep the latest closures in refs so the listener can stay registered once
  // (no re-bind churn) while always calling the current handlers/route.
  const handlers = useRef({ openPalette, openHelp, closeAll, navigate, toggleLang });
  handlers.current = { openPalette, openHelp, closeAll, navigate, toggleLang };
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  useEffect(() => {
    const pending = { active: false };
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const clearPending = () => {
      pending.active = false;
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = undefined;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const h = handlers.current;

      // ⌘K / Ctrl-K: toggle the palette regardless of focus target.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        clearPending();
        h.openPalette();
        return;
      }

      // Any other modifier combo is a browser/OS shortcut — leave it alone.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Ignore bare keys while typing (Esc still closes overlays).
      if (e.key !== 'Escape' && isTypingTarget(document.activeElement)) return;

      const { nextPending, action } = resolveKey(pending.active, e.key);

      pending.active = nextPending;
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = undefined;
      }
      if (nextPending) {
        resetTimer = setTimeout(() => {
          pending.active = false;
        }, PENDING_RESET_MS);
      }

      if (!action) return;

      switch (action.type) {
        case 'goto':
          e.preventDefault();
          h.navigate(action.to);
          break;
        case 'new':
          e.preventDefault();
          h.navigate(contextualNew(pathnameRef.current));
          break;
        case 'theme':
          e.preventDefault();
          // No pointer origin — reveal from the sidebar theme button.
          toggleThemeWithReveal();
          break;
        case 'lang':
          e.preventDefault();
          h.toggleLang();
          break;
        case 'help':
          e.preventDefault();
          h.openHelp();
          break;
        case 'esc':
          h.closeAll();
          break;
        case 'palette':
          e.preventDefault();
          h.openPalette();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearPending();
    };
  }, []);
}
