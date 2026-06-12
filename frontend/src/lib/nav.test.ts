import { describe, it, expect } from 'vitest';
import { NAV_GROUPS, NAV_ITEMS } from '@/lib/nav';

describe('nav model', () => {
  it('covers all 10 authenticated destinations', () => {
    const paths = NAV_ITEMS.map((i) => i.to);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/dashboard',
        '/focus',
        '/history',
        '/schedule',
        '/courses',
        '/grades',
        '/roadmap',
        '/analysis',
        '/analytics',
        '/deadlines',
      ]),
    );
  });
  it('every item belongs to exactly one group', () => {
    const grouped = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.to));
    expect(grouped.sort()).toEqual(NAV_ITEMS.map((i) => i.to).sort());
  });
});
