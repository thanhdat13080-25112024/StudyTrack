import { describe, it, expect } from 'vitest';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';

function keys(o: object, p = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as object, `${p}${k}.`) : [`${p}${k}`],
  );
}
describe('i18n parity', () => {
  it('vi and en have identical key sets', () => {
    expect(keys(vi).sort()).toEqual(keys(en).sort());
  });
  it('has the new nav group keys', () => {
    expect(keys(vi)).toEqual(
      expect.arrayContaining(['nav.group.habit', 'nav.group.academic', 'nav.group.insight']),
    );
  });
});
