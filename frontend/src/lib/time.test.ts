import { describe, expect, it } from 'vitest';
import { formatSeconds, localDateISO } from './time';

describe('formatSeconds', () => {
  it('formats HH:MM:SS', () => {
    expect(formatSeconds(0)).toBe('00:00:00');
    expect(formatSeconds(59)).toBe('00:00:59');
    expect(formatSeconds(60)).toBe('00:01:00');
    expect(formatSeconds(3661)).toBe('01:01:01');
  });
  it('clamps negatives to zero', () => {
    expect(formatSeconds(-5)).toBe('00:00:00');
  });
});

describe('localDateISO', () => {
  it('builds from wall-clock fields (no UTC shift)', () => {
    // 2026-01-15 23:30 local — toISOString could roll to the 16th in +tz.
    const d = new Date(2026, 0, 15, 23, 30, 0);
    expect(localDateISO(d)).toBe('2026-01-15');
  });
  it('zero-pads month and day', () => {
    const d = new Date(2026, 2, 3, 8, 0, 0);
    expect(localDateISO(d)).toBe('2026-03-03');
  });
});
