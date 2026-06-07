/**
 * Smart-suggestion rendering — port of the legacy `generateSmartSuggestion`.
 *
 * The backend returns a structured suggestion (`type` + inputs); the frontend
 * renders the localized vi/en text via i18next. `suggestionKey` maps the type
 * to its i18n key; `renderSuggestion` prepends the shared intro and interpolates
 * the chosen method + focus level.
 */
import type { Suggestion } from './types';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export function suggestionKey(s: Suggestion): string {
  return `suggestions.${s.type}`;
}

export function renderSuggestion(t: Translate, s: Suggestion): string {
  const params = { method: s.method, focus: s.focus };
  return `${t('suggestions.intro', params)} ${t(suggestionKey(s), params)}`;
}
