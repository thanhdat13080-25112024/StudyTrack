/**
 * shortcuts — the single source of truth for the keyboard layer (Phase C).
 *
 * Pure, React/DOM-free logic so it can be unit-tested in isolation:
 *  - `GOTO` maps a single letter to a route (cross-checked against `NAV_ITEMS`).
 *  - `resolveKey` is the `g`-combo state machine + direct-key dispatcher.
 *  - `contextualNew` resolves the context-aware "new" destination.
 *  - `isTypingTarget` decides whether bare shortcuts should be ignored.
 *  - `SHORTCUT_ROWS` is the structured data the ShortcutHelp overlay renders.
 *
 * `useGlobalShortcuts` consumes these; the keymap is documented in the Phase C
 * plan (docs/superpowers/plans/2026-06-10-notion-redesign-c.md).
 */

/** A go-to row: press `g` then `letter` to navigate to `to` (labelled by `navKey`). */
export interface GotoRow {
  letter: string;
  to: string;
  navKey: string;
}

/**
 * `g` then ⟨letter⟩ → route. Every `to`/`navKey` mirrors a `NAV_ITEMS` entry
 * (asserted in shortcuts.test.ts). Letters are distinct lowercase singletons.
 */
export const GOTO: GotoRow[] = [
  { letter: 'd', to: '/dashboard', navKey: 'nav.dashboard' },
  { letter: 'f', to: '/focus', navKey: 'nav.focus' },
  { letter: 'h', to: '/history', navKey: 'nav.history' },
  { letter: 's', to: '/schedule', navKey: 'nav.schedule' },
  { letter: 'c', to: '/courses', navKey: 'nav.courses' },
  { letter: 'g', to: '/grades', navKey: 'nav.grades' },
  { letter: 'r', to: '/roadmap', navKey: 'nav.roadmap' },
  { letter: 'a', to: '/analysis', navKey: 'nav.analysis' },
  { letter: 'y', to: '/analytics', navKey: 'nav.analytics' },
  { letter: 'k', to: '/deadlines', navKey: 'nav.deadlines' },
];

const GOTO_BY_LETTER = new Map(GOTO.map((row) => [row.letter, row.to]));

/** A resolved keyboard intent dispatched by `useGlobalShortcuts`. */
export type ShortcutAction =
  | { type: 'goto'; to: string }
  | { type: 'new' }
  | { type: 'theme' }
  | { type: 'lang' }
  | { type: 'help' }
  | { type: 'palette' }
  | { type: 'esc' };

export interface ResolveResult {
  nextPending: boolean;
  action: ShortcutAction | null;
}

/**
 * The `g`-combo state machine + direct-key dispatcher.
 *
 * - When `pending` (a `g` was just pressed), the next key is interpreted as a
 *   goto letter: a known letter navigates, anything else just resets pending.
 *   Pending is always consumed (`nextPending: false`).
 * - When not pending, `g` enters pending; the direct keys map to their action;
 *   any unmapped key resolves to a no-op.
 */
export function resolveKey(pending: boolean, key: string): ResolveResult {
  if (pending) {
    const to = GOTO_BY_LETTER.get(key);
    return to
      ? { nextPending: false, action: { type: 'goto', to } }
      : { nextPending: false, action: null };
  }

  if (key === 'g') {
    return { nextPending: true, action: null };
  }

  switch (key) {
    case 'n':
      return { nextPending: false, action: { type: 'new' } };
    case 't':
      return { nextPending: false, action: { type: 'theme' } };
    case 'l':
      return { nextPending: false, action: { type: 'lang' } };
    case '?':
      return { nextPending: false, action: { type: 'help' } };
    case 'Escape':
      return { nextPending: false, action: { type: 'esc' } };
    default:
      return { nextPending: false, action: null };
  }
}

/** Routes where "new" should create a course (the academic cluster). */
const ACADEMIC_ROUTES = new Set(['/courses', '/grades', '/roadmap', '/analysis']);

/**
 * Context-aware "new" destination (navigate-only): a course on academic pages,
 * a deadline on /deadlines, otherwise a focus session.
 */
export function contextualNew(pathname: string): string {
  if (ACADEMIC_ROUTES.has(pathname)) return '/courses';
  if (pathname === '/deadlines') return '/deadlines';
  return '/focus';
}

/** True when the element is a text-entry target (bare shortcuts are ignored). */
export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  // Read the attribute directly: jsdom doesn't implement the live
  // `isContentEditable` property, and an explicit "false" must opt out.
  const editable = el.getAttribute('contenteditable');
  return editable !== null && editable !== 'false';
}

/** A help-overlay row: a group, the visible key chips, and an i18n description key. */
export interface ShortcutRow {
  group: 'navigation' | 'actions';
  /** Ordered key chips, e.g. `['g', '⟨d⟩']` or `['⌘', 'K']`. */
  keys: string[];
  descKey: string;
  /** Set only on the go-to row so the overlay can render the per-page legend. */
  goto?: boolean;
}

/**
 * Structured data for ShortcutHelp — the single source for the overlay so the
 * displayed bindings can never drift from `resolveKey`.
 */
export const SHORTCUT_ROWS: ShortcutRow[] = [
  { group: 'navigation', keys: ['⌘', 'K'], descKey: 'shortcuts.palette' },
  { group: 'navigation', keys: ['g', '⟨_⟩'], descKey: 'shortcuts.goto', goto: true },
  { group: 'actions', keys: ['n'], descKey: 'shortcuts.new' },
  { group: 'actions', keys: ['t'], descKey: 'shortcuts.theme' },
  { group: 'actions', keys: ['l'], descKey: 'shortcuts.lang' },
  { group: 'actions', keys: ['?'], descKey: 'shortcuts.help' },
];
