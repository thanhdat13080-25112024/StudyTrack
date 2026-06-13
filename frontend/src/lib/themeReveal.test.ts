import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from '@/store/uiStore';
import { toggleThemeWithReveal } from './themeReveal';

/** Minimal ViewTransition stub: runs the DOM-update callback synchronously. */
function stubViewTransition() {
  const startViewTransition = vi.fn((cb: () => void) => {
    cb();
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
      skipTransition: vi.fn(),
    };
  });
  Object.defineProperty(document, 'startViewTransition', {
    value: startViewTransition,
    configurable: true,
    writable: true,
  });
  return startViewTransition;
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('toggleThemeWithReveal', () => {
  beforeEach(() => {
    useUiStore.setState({ theme: 'light' });
    document.documentElement.className = '';
    document.documentElement.animate = vi.fn() as unknown as Element['animate'];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'startViewTransition');
  });

  it('flips instantly when View Transitions are unsupported (fallback)', () => {
    expect('startViewTransition' in document).toBe(false);
    toggleThemeWithReveal();
    expect(useUiStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('flips instantly (no transition) when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }));
    const startViewTransition = stubViewTransition();
    toggleThemeWithReveal();
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(useUiStore.getState().theme).toBe('dark');
  });

  it('runs an expanding clip-circle via the View Transitions API', async () => {
    const startViewTransition = stubViewTransition();
    toggleThemeWithReveal({ x: 100, y: 100 });

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(useUiStore.getState().theme).toBe('dark');
    // global color transition is suppressed mid-reveal
    expect(document.documentElement.classList.contains('theme-reveal-active')).toBe(true);

    await Promise.resolve();
    const animate = document.documentElement.animate as ReturnType<typeof vi.fn>;
    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes, opts] = animate.mock.calls[0];
    expect(keyframes.clipPath[0]).toBe('circle(0px at 100px 100px)');
    expect(keyframes.clipPath[1]).toContain('at 100px 100px');
    expect(opts.pseudoElement).toBe('::view-transition-new(root)');
  });

  it('reveals from the [data-theme-toggle] button center when no origin is given', async () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-theme-toggle', '');
    btn.getBoundingClientRect = () => rect(10, 20, 40, 40); // center = (30, 40)
    document.body.appendChild(btn);
    stubViewTransition();

    toggleThemeWithReveal();

    await Promise.resolve();
    const animate = document.documentElement.animate as ReturnType<typeof vi.fn>;
    const [keyframes] = animate.mock.calls[0];
    expect(keyframes.clipPath[0]).toBe('circle(0px at 30px 40px)');
    btn.remove();
  });
});
