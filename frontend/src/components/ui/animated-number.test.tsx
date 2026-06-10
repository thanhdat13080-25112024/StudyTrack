import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
// Force the reduced-motion branch deterministically (no matchMedia dependency).
vi.mock('framer-motion', async (orig) => ({
  ...(await orig<typeof import('framer-motion')>()),
  useReducedMotion: () => true,
}));
import { AnimatedNumber } from '@/components/ui/animated-number';

describe('AnimatedNumber', () => {
  it('renders the final value immediately under reduced motion', () => {
    render(<AnimatedNumber value={120} decimals={0} suffix=" min" />);
    expect(screen.getByText('120 min')).toBeInTheDocument();
  });
  it('formats with fixed decimals under reduced motion', () => {
    render(<AnimatedNumber value={3.456} decimals={2} />);
    expect(screen.getByText('3.46')).toBeInTheDocument();
  });
});
