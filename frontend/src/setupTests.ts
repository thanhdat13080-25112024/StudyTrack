import '@testing-library/jest-dom/vitest';

/**
 * Node 22+ exposes an experimental global `localStorage`/`sessionStorage`
 * accessor that returns `undefined` unless `--localstorage-file` is passed.
 * In vitest's jsdom environment `window === globalThis`, so that accessor
 * shadows jsdom's own Storage and leaves `window.localStorage` undefined.
 *
 * CI runs Node 20 (no such global — jsdom's Storage works), but local devs on
 * Node 22+ would see tests crash on any localStorage access. Install a small
 * in-memory Storage only when the environment doesn't already provide one, so
 * `make test` passes on every Node version without overriding jsdom on Node 20.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function ensureStorage(name: 'localStorage' | 'sessionStorage'): void {
  if (typeof globalThis[name] !== 'undefined' && globalThis[name] !== null) {
    return;
  }
  Object.defineProperty(globalThis, name, {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');
