import { describe, it, expect } from 'vitest';
import { getMotion, pageVariants, listStagger } from '@/lib/motion';

describe('getMotion', () => {
  it('returns real durations when motion is allowed', () => {
    const m = getMotion(false);
    expect(m.duration).toBeGreaterThan(0);
    expect(m.page).toBe(pageVariants);
  });
  it('collapses to instant when reduced motion is requested', () => {
    const m = getMotion(true);
    expect(m.duration).toBe(0);
    expect(m.page.animate).toMatchObject({ opacity: 1 });
    expect(m.list).toEqual({});
  });
});

// listStagger is part of the public surface consumed by the shell/palette.
describe('listStagger', () => {
  it('staggers children when motion is allowed', () => {
    expect(getMotion(false).list).toBe(listStagger);
  });
});
