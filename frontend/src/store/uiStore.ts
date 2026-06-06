/**
 * UI store — theme + language (Zustand).
 *
 * Server state lives in TanStack Query (features/); timer/UI state lives in
 * Zustand. This store is the single source of truth for theme + language in the
 * UI: it applies them locally (DOM + localStorage via lib/theme + lib/i18n) and,
 * when the user is authenticated, writes the choice back to the server
 * (`PATCH /api/auth/me`) so it syncs across devices. `hydrate()` is used on login
 * to adopt the server's stored prefs WITHOUT echoing them back to the server.
 */
import { create } from 'zustand';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme';
import { setLanguage, type Lang } from '@/lib/i18n';
import i18n from '@/lib/i18n';
import { apiClient, getToken } from '@/lib/apiClient';

interface UiState {
  theme: Theme;
  lang: Lang;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Adopt server-stored prefs on login (apply locally, no server write-back). */
  hydrate: (lang: Lang, theme: Theme) => void;
}

function currentLang(): Lang {
  return i18n.resolvedLanguage === 'en' ? 'en' : 'vi';
}

/** Fire-and-forget persist of the changed pref when authenticated. */
function persistPrefs(partial: { lang?: Lang; theme?: Theme }): void {
  if (getToken()) {
    void apiClient.patch('/api/auth/me', partial).catch(() => {});
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: getStoredTheme(),
  lang: currentLang(),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
    persistPrefs({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
    persistPrefs({ theme: next });
  },
  setLang: (lang) => {
    setLanguage(lang);
    set({ lang });
    persistPrefs({ lang });
  },
  toggleLang: () => {
    const next: Lang = get().lang === 'vi' ? 'en' : 'vi';
    setLanguage(next);
    set({ lang: next });
    persistPrefs({ lang: next });
  },
  hydrate: (lang, theme) => {
    applyTheme(theme);
    setLanguage(lang);
    set({ lang, theme });
  },
}));
