/**
 * Theme circular-reveal — wraps the uiStore theme flip in a View Transitions
 * API "expanding circle" so the new theme is wiped in from a point (the theme
 * button) outward, instead of switching instantly.
 *
 * Graceful degradation, per the project motion rules:
 *  - No View Transitions support (e.g. Firefox) OR `prefers-reduced-motion` →
 *    flip instantly, no animation.
 * The clip-path circle is animated on `::view-transition-new(root)`; the
 * accompanying CSS (globals.css) strips the default cross-fade and suppresses
 * the global color transition mid-reveal so the revealed edge stays crisp.
 */
import { flushSync } from 'react-dom';
import { DUR } from '@/lib/motion';
import { useUiStore } from '@/store/uiStore';

/** Duration is single-sourced from the motion tokens (DUR.slow = 0.6s). */
const REVEAL_MS = DUR.slow * 1000;
/** Smooth in-out, no overshoot — matches the "Smooth & Fluid" chrome personality. */
const REVEAL_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
/** Marker on the sidebar theme button, used as the origin for keyboard/⌘K flips. */
const TOGGLE_SELECTOR = '[data-theme-toggle]';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

type Point = { x: number; y: number };
export type RevealOrigin = Point | HTMLElement;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches;
}

function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Resolve the circle's center: an explicit element/point wins; otherwise fall
 * back to the sidebar theme button (keyboard / command-palette path), then to
 * the viewport center.
 */
function resolveOrigin(origin?: RevealOrigin | null): Point {
  if (origin instanceof HTMLElement) return centerOf(origin);
  if (origin) return origin;
  const btn = document.querySelector(TOGGLE_SELECTOR);
  if (btn) return centerOf(btn);
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/**
 * Flip the theme with the circular reveal. Pass the clicked button (or a point)
 * for the origin; omit it for keyboard/⌘K flips to reveal from the theme button.
 */
export function toggleThemeWithReveal(origin?: RevealOrigin | null): void {
  const apply = () => useUiStore.getState().toggleTheme();

  const canReveal =
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !prefersReducedMotion();

  if (!canReveal) {
    apply();
    return;
  }

  const { x, y } = resolveOrigin(origin);
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const root = document.documentElement;
  // Disable the global 0.25s color transition for the duration of the reveal so
  // the new (live) snapshot shows final colors crisply, not mid-fade.
  root.classList.add('theme-reveal-active');

  // flushSync so React-driven bits (the Sun/Moon icon) are captured in the new
  // snapshot rather than popping a frame late.
  const transition = document.startViewTransition(() => flushSync(apply));

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: REVEAL_MS,
          easing: REVEAL_EASING,
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      /* transition skipped/interrupted (e.g. rapid re-toggle) — ignore */
    });

  void transition.finished.finally(() => {
    root.classList.remove('theme-reveal-active');
  });
}
