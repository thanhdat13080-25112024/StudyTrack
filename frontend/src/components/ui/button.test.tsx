import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('primary (default) is a pill with accent fill', () => {
    const { getByRole } = render(<Button>Go</Button>);
    expect(getByRole('button').className).toMatch(/rounded-pill/);
    expect(getByRole('button').className).toMatch(/bg-accent/);
  });
  it('utility uses the tighter md radius', () => {
    const { getByRole } = render(<Button variant="utility">Go</Button>);
    expect(getByRole('button').className).toMatch(/rounded-md/);
  });
  it('outline stays available (back-compat) and is pill-shaped like secondary', () => {
    const { getByRole } = render(<Button variant="outline">Go</Button>);
    expect(getByRole('button').className).toMatch(/rounded-pill/);
  });
});
