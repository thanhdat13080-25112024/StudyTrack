import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePresence } from '@/hooks/usePresence';

describe('usePresence', () => {
  it('renders immediately when opened', () => {
    const { result, rerender } = renderHook(({ open }) => usePresence(open), {
      initialProps: { open: false },
    });
    expect(result.current.rendered).toBe(false);
    rerender({ open: true });
    expect(result.current.rendered).toBe(true);
  });

  it('stays rendered after close until onExited is called', () => {
    const { result, rerender } = renderHook(({ open }) => usePresence(open), {
      initialProps: { open: true },
    });
    rerender({ open: false });
    expect(result.current.rendered).toBe(true); // still mounted for exit anim
    act(() => result.current.onExited());
    expect(result.current.rendered).toBe(false);
  });
});
