import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Collect the focusable descendants of `container`, in DOM order. Skips
 * `hidden`/`aria-hidden` subtrees. We deliberately avoid `offsetParent`-based
 * visibility checks: the drawer is `position: fixed` (so its children's
 * `offsetParent` is `null` in real browsers) and jsdom has no layout at all,
 * so an offset check would wrongly drop every element. The CSS selector
 * already excludes `disabled` controls and `tabindex="-1"`.
 */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Trap focus inside `ref` while `active`, and lock body scroll for the same
 * window. On open: lock `document.body` scroll and move focus to the first
 * focusable element in the container. While open: Tab / Shift-Tab cycle within
 * the container (wrapping at both ends). On close: restore body scroll and
 * return focus to whatever was focused before the trap opened (the trigger).
 *
 * Escape-to-close stays with the consumer; this hook is purely the trap +
 * scroll-lock. It does no animation, so it is reduced-motion-agnostic.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Lock body scroll, remembering the prior inline value to restore exactly.
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    // Focus the first focusable element (fall back to the container itself).
    const focusables = getFocusable(container);
    (focusables[0] ?? container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable(container);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !container.contains(activeEl)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}
