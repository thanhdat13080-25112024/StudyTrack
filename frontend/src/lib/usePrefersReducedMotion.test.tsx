import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from '@/lib/motion';

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches,
    media: q,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  }));
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('returns true when the user prefers reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when the user has no motion preference', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
