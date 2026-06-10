import { describe, it, expect } from 'vitest';
import { ringProgress } from '@/components/timer/TimerRing';

describe('ringProgress', () => {
  it('returns 0 when nothing is planned (avoids divide-by-zero)', () => {
    expect(ringProgress(0, 0)).toBe(0);
  });
  it('returns the fraction remaining', () => {
    expect(ringProgress(30, 60)).toBe(0.5);
  });
  it('clamps to [0,1]', () => {
    expect(ringProgress(90, 60)).toBe(1);
    expect(ringProgress(-5, 60)).toBe(0);
  });
});
