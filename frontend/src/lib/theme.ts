/**
 * Theme handling — port of the legacy `toggleTheme` / `syncThemeUI`.
 *
 * Legacy set `data-theme` on <body> (default "dark"). Here we toggle the
 * Tailwind `dark` class on <html> (darkMode: 'class') and persist the choice.
 * Default theme is `dark` to preserve legacy behavior.
 */

export type Theme = 'light' | 'dark';

// Legacy localStorage key (kept for continuity with the original app).
const STORAGE_KEY = 'track_theme';
const DEFAULT_THEME: Theme = 'dark';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
}

/** Apply the persisted (or default) theme. Call once on boot. */
export function initTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

/** Flip the theme and persist; returns the new theme. */
export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
