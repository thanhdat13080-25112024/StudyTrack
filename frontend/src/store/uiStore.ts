/**
 * UI store — theme + language (Zustand).
 *
 * Server state lives in TanStack Query (features/); timer/UI state lives in
 * Zustand. This bootstrap store covers theme + language so the shell can
 * toggle them. It delegates persistence to lib/theme + lib/i18n.
 */
import { create } from 'zustand';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme';
import { setLanguage, type Lang } from '@/lib/i18n';
import i18n from '@/lib/i18n';

interface UiState {
  theme: Theme;
  lang: Lang;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

function currentLang(): Lang {
  return i18n.resolvedLanguage === 'en' ? 'en' : 'vi';
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: getStoredTheme(),
  lang: currentLang(),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
  setLang: (lang) => {
    setLanguage(lang);
    set({ lang });
  },
  toggleLang: () => {
    const next: Lang = get().lang === 'vi' ? 'en' : 'vi';
    setLanguage(next);
    set({ lang: next });
  },
}));
