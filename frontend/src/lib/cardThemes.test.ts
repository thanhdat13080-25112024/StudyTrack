import { describe, expect, it } from 'vitest';
import { CARD_THEMES, DEFAULT_CARD_THEME, asCardTheme, cardThemes } from './cardThemes';

describe('cardThemes', () => {
  it('has a config for all 4 themes', () => {
    expect(CARD_THEMES).toHaveLength(4);
    for (const k of CARD_THEMES) {
      expect(cardThemes[k].title.length).toBeGreaterThan(0);
      expect(cardThemes[k].swatch).toContain('gradient');
    }
  });

  it('vnu-green has no watermark (user decision)', () => {
    expect(cardThemes['vnu-green'].watermark).toBeUndefined();
  });

  it('asCardTheme falls back to default', () => {
    expect(asCardTheme('vju-red')).toBe('vju-red');
    expect(asCardTheme('bogus')).toBe(DEFAULT_CARD_THEME);
    expect(asCardTheme(null)).toBe(DEFAULT_CARD_THEME);
  });
});
