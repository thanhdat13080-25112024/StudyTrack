import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Drive usePrefersReducedMotion deterministically via a hoisted mutable flag so
// each test can pick the smooth (false) or instant (true) branch.
const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock('@/lib/motion', async (orig) => ({
  ...(await orig<typeof import('@/lib/motion')>()),
  usePrefersReducedMotion: () => motion.reduced,
}));

import { useScrollToTop } from '@/hooks/useScrollToTop';

const scrollTo = vi.fn();

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollToTop(ref);
  const navigate = useNavigate();
  return (
    <div>
      <div ref={ref} data-testid="scroller" />
      <button onClick={() => navigate('/grades')}>go</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="*" element={<Harness />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('useScrollToTop', () => {
  beforeEach(() => {
    scrollTo.mockClear();
    motion.reduced = false;
    // jsdom doesn't implement scrollTo on elements.
    Element.prototype.scrollTo = scrollTo as unknown as Element['scrollTo'];
  });

  it('scrolls the container to the top on mount (smooth when motion allowed)', () => {
    renderHarness();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });

  it('scrolls to top again when the route changes', () => {
    const { getByText } = renderHarness();
    scrollTo.mockClear();
    act(() => {
      getByText('go').click();
    });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });

  it('uses an instant jump when reduced motion is preferred', () => {
    motion.reduced = true;
    renderHarness();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });
});
