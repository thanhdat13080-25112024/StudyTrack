import { describe, expect, it } from 'vitest';
import en from '@/locales/en.json';
import { getPreviewResponse } from './previewData';

type WeakLike = { priority: string; signals: string[] };

describe('previewData.getPreviewResponse', () => {
  it('serves array fixtures for list GETs', () => {
    expect(Array.isArray(getPreviewResponse('GET', '/api/courses'))).toBe(true);
    expect(Array.isArray(getPreviewResponse('GET', '/api/deadlines'))).toBe(true);
    expect(Array.isArray(getPreviewResponse('GET', '/api/sessions'))).toBe(true);
  });

  it('ignores the query string when matching the path', () => {
    expect(getPreviewResponse('GET', '/api/grades?semester_id=2')).toEqual(
      getPreviewResponse('GET', '/api/grades'),
    );
  });

  it('derives the unread count from the unread notifications', () => {
    const res = getPreviewResponse('GET', '/api/notifications/unread-count') as { count: number };
    expect(res.count).toBeGreaterThan(0);
  });

  it('returns a dashboard with kpis + chart', () => {
    const d = getPreviewResponse('GET', '/api/dashboard') as { kpis: unknown; chart: unknown[] };
    expect(d.kpis).toBeDefined();
    expect(Array.isArray(d.chart)).toBe(true);
  });

  it('returns the me fixture with a user + profile', () => {
    const me = getPreviewResponse('GET', '/api/auth/me') as {
      user: { email: string };
      profile: unknown;
    };
    expect(me.user.email).toContain('@');
    expect(me.profile).toBeDefined();
  });

  it('uses weak-subject priority/signal values that have matching i18n keys', () => {
    const weak = getPreviewResponse('GET', '/api/analysis/weak-subjects') as WeakLike[];
    expect(weak.length).toBeGreaterThan(0);
    const priorityKeys = Object.keys(en.weakSubject.priority);
    const signalKeys = Object.keys(en.weakSubject.signal);
    for (const w of weak) {
      expect(priorityKeys).toContain(w.priority);
      for (const s of w.signals) expect(signalKeys).toContain(s);
    }
  });

  it('echoes a created entity with an id for unknown mutations', () => {
    const res = getPreviewResponse('POST', '/api/courses', { code: 'X', name: 'Y' }) as {
      id: number;
      code: string;
    };
    expect(typeof res.id).toBe('number');
    expect(res.code).toBe('X');
  });
});
