import { describe, expect, it } from 'vitest';
import { suggestionKey, renderSuggestion } from './suggestion';
import type { Suggestion } from './types';

describe('suggestionKey', () => {
  it('maps type to i18n key', () => {
    expect(
      suggestionKey({
        type: 'pomodoro_not_25',
        method: 'Pomodoro',
        focus: 9,
        planned_minutes: 30,
      }),
    ).toBe('suggestions.pomodoro_not_25');
    expect(
      suggestionKey({ type: 'high_focus', method: 'Deep Work', focus: 8, planned_minutes: 60 }),
    ).toBe('suggestions.high_focus');
    expect(
      suggestionKey({
        type: 'boost_focus',
        method: 'Active Recall',
        focus: 5,
        planned_minutes: 40,
      }),
    ).toBe('suggestions.boost_focus');
  });
});

describe('renderSuggestion', () => {
  // Fake `t` echoes back the key + params so we can assert key selection + interpolation.
  const fakeT = (key: string, params?: Record<string, unknown>) =>
    params ? `${key}|${JSON.stringify(params)}` : key;

  it('combines the intro key with the type key, passing method + focus', () => {
    const s: Suggestion = { type: 'high_focus', method: 'Deep Work', focus: 8, planned_minutes: 60 };
    const out = renderSuggestion(fakeT, s);
    expect(out).toContain('suggestions.intro');
    expect(out).toContain('suggestions.high_focus');
    expect(out).toContain('"method":"Deep Work"');
    expect(out).toContain('"focus":8');
  });
});
