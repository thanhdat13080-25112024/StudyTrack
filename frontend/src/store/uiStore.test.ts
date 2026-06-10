import { describe, it, expect, beforeEach, vi } from 'vitest';

const { patchMock, getTokenMock } = vi.hoisted(() => ({
  patchMock: vi.fn(),
  getTokenMock: vi.fn(),
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: { patch: patchMock },
  getToken: getTokenMock,
}));

import { useUiStore } from './uiStore';
import { getStoredTheme } from '@/lib/theme';

describe('uiStore prefs persistence', () => {
  beforeEach(() => {
    patchMock.mockReset().mockResolvedValue({});
    getTokenMock.mockReset().mockReturnValue(null);
    useUiStore.setState({ theme: 'dark', lang: 'vi' });
  });

  it('toggles locally but does NOT persist to the server when unauthenticated', () => {
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('light');
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('persists the changed pref to the server when authenticated', () => {
    getTokenMock.mockReturnValue('jwt');
    useUiStore.getState().toggleTheme();
    expect(patchMock).toHaveBeenCalledWith('/api/auth/me', { theme: 'light' });

    useUiStore.getState().toggleLang();
    expect(patchMock).toHaveBeenCalledWith('/api/auth/me', { lang: 'en' });
  });

  it('hydrate adopts server prefs without echoing back to the server', () => {
    getTokenMock.mockReturnValue('jwt');
    useUiStore.getState().hydrate('en', 'light');
    expect(useUiStore.getState().lang).toBe('en');
    expect(useUiStore.getState().theme).toBe('light');
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('defaults to light when nothing is stored (Notion is light-first)', () => {
    window.localStorage.removeItem('track_theme');
    expect(getStoredTheme()).toBe('light');
  });
});
