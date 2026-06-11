import { describe, it, expect } from 'vitest';
import {
  GOTO,
  SHORTCUT_ROWS,
  resolveKey,
  contextualNew,
  isTypingTarget,
} from '@/lib/shortcuts';
import { NAV_ITEMS } from '@/lib/nav';

describe('shortcuts: GOTO table', () => {
  it('has the 10 goto rows', () => {
    expect(GOTO).toHaveLength(10);
  });
  it('every goto route exists in NAV_ITEMS', () => {
    const navRoutes = new Set(NAV_ITEMS.map((i) => i.to));
    for (const row of GOTO) {
      expect(navRoutes.has(row.to)).toBe(true);
    }
  });
  it('every goto navKey matches the NAV_ITEMS key for that route', () => {
    const byRoute = new Map(NAV_ITEMS.map((i) => [i.to, i.key]));
    for (const row of GOTO) {
      expect(row.navKey).toBe(byRoute.get(row.to));
    }
  });
  it('uses distinct single-letter triggers', () => {
    const letters = GOTO.map((r) => r.letter);
    expect(new Set(letters).size).toBe(letters.length);
    for (const l of letters) expect(l).toMatch(/^[a-z]$/);
  });
});

describe('shortcuts: resolveKey g-combo state machine', () => {
  it('g enters pending with no action', () => {
    expect(resolveKey(false, 'g')).toEqual({ nextPending: true, action: null });
  });
  it('g then d navigates to /dashboard and clears pending', () => {
    expect(resolveKey(true, 'd')).toEqual({
      nextPending: false,
      action: { type: 'goto', to: '/dashboard' },
    });
  });
  it('g then g navigates to /grades (second g consumed as goto letter)', () => {
    expect(resolveKey(true, 'g')).toEqual({
      nextPending: false,
      action: { type: 'goto', to: '/grades' },
    });
  });
  it('g then an unknown letter resets without navigating', () => {
    expect(resolveKey(true, 'x')).toEqual({ nextPending: false, action: null });
  });
});

describe('shortcuts: resolveKey direct keys', () => {
  it('n -> new', () => {
    expect(resolveKey(false, 'n')).toEqual({ nextPending: false, action: { type: 'new' } });
  });
  it('t -> theme', () => {
    expect(resolveKey(false, 't')).toEqual({ nextPending: false, action: { type: 'theme' } });
  });
  it('l -> lang', () => {
    expect(resolveKey(false, 'l')).toEqual({ nextPending: false, action: { type: 'lang' } });
  });
  it('? -> help', () => {
    expect(resolveKey(false, '?')).toEqual({ nextPending: false, action: { type: 'help' } });
  });
  it('Escape -> esc', () => {
    expect(resolveKey(false, 'Escape')).toEqual({ nextPending: false, action: { type: 'esc' } });
  });
  it('an unmapped key resolves to null with no pending', () => {
    expect(resolveKey(false, 'q')).toEqual({ nextPending: false, action: null });
  });
});

describe('shortcuts: contextualNew', () => {
  it('academic routes -> /courses', () => {
    expect(contextualNew('/grades')).toBe('/courses');
    expect(contextualNew('/courses')).toBe('/courses');
    expect(contextualNew('/roadmap')).toBe('/courses');
    expect(contextualNew('/analysis')).toBe('/courses');
  });
  it('/deadlines -> /deadlines', () => {
    expect(contextualNew('/deadlines')).toBe('/deadlines');
  });
  it('any other route -> /focus', () => {
    expect(contextualNew('/dashboard')).toBe('/focus');
    expect(contextualNew('/history')).toBe('/focus');
    expect(contextualNew('/anything')).toBe('/focus');
  });
});

describe('shortcuts: isTypingTarget', () => {
  it('true for input', () => {
    expect(isTypingTarget(document.createElement('input'))).toBe(true);
  });
  it('true for textarea', () => {
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
  });
  it('true for select', () => {
    expect(isTypingTarget(document.createElement('select'))).toBe(true);
  });
  it('true for contenteditable element', () => {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    expect(isTypingTarget(el)).toBe(true);
  });
  it('false for button, div, and null', () => {
    expect(isTypingTarget(document.createElement('button'))).toBe(false);
    expect(isTypingTarget(document.createElement('div'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('shortcuts: SHORTCUT_ROWS', () => {
  it('groups rows under navigation and actions', () => {
    const groups = new Set(SHORTCUT_ROWS.map((r) => r.group));
    expect(groups.has('navigation')).toBe(true);
    expect(groups.has('actions')).toBe(true);
  });
  it('every row carries a binding display and an i18n description key', () => {
    for (const row of SHORTCUT_ROWS) {
      expect(row.keys.length).toBeGreaterThan(0);
      expect(row.descKey).toMatch(/^shortcuts\./);
    }
  });
});
