import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
// Force the reduced-motion branch deterministically (no matchMedia dependency).
vi.mock('framer-motion', async (orig) => ({
  ...(await orig<typeof import('framer-motion')>()),
  useReducedMotion: () => true,
}));
import { AnimatedNumber, formatNumber } from '@/components/ui/animated-number';

describe('formatNumber', () => {
  it('formats integers with no decimals', () => {
    expect(formatNumber(42, 0)).toBe('42');
  });
  it('formats with fixed decimals', () => {
    expect(formatNumber(3.456, 2)).toBe('3.46');
  });
});

describe('AnimatedNumber', () => {
  it('renders the final value immediately under reduced motion', () => {
    render(<AnimatedNumber value={120} decimals={0} suffix=" min" />);
    expect(screen.getByText('120 min')).toBeInTheDocument();
  });
});
