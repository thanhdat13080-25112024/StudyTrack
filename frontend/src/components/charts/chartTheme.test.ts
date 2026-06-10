import { describe, it, expect } from 'vitest';
import { chartSeries } from '@/components/charts/chartTheme';

describe('chartSeries', () => {
  it('starts with the accent token and has a full sticker palette', () => {
    const s = chartSeries();
    expect(s[0]).toBe('var(--accent-color)');
    expect(s.length).toBeGreaterThanOrEqual(6);
  });
  it('contains no undefined legacy brand vars', () => {
    const s = chartSeries();
    expect(s.some((c) => /brand-(emerald|gold|rose|violet)/.test(c))).toBe(false);
  });
});
