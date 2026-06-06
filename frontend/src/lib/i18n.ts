/**
 * react-i18next bootstrap.
 *
 * Migrates the legacy `langData` dictionary to JSON resource bundles.
 * Default language is `vi` (legacy default). Language choice is persisted to
 * localStorage under the legacy key `track_lang` so it survives reloads.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import vi from '@/locales/vi.json';
import en from '@/locales/en.json';

export const LANG_STORAGE_KEY = 'track_lang';
export const supportedLngs = ['vi', 'en'] as const;
export type Lang = (typeof supportedLngs)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    supportedLngs: [...supportedLngs],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

/** Switch language and persist; returns the active language. */
export function setLanguage(lang: Lang): Lang {
  void i18n.changeLanguage(lang);
  return lang;
}

/** Flip between vi/en. */
export function toggleLanguage(): Lang {
  const next: Lang = i18n.resolvedLanguage === 'vi' ? 'en' : 'vi';
  return setLanguage(next);
}

export default i18n;
