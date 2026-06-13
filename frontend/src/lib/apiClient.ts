/**
 * Minimal fetch wrapper for the StudyTrack backend.
 *
 * baseURL comes from `import.meta.env.VITE_API_URL` (set per environment).
 * Auth uses a bearer JWT stored in localStorage (`track_token`); it is attached
 * as `Authorization: Bearer <token>` on every request. A 401 on an
 * authenticated request clears the token and bounces to /login. Response shapes
 * are typed against `lib/api-types.ts` (generated from the backend OpenAPI).
 */

import { PREVIEW_MODE } from '@/lib/previewMode';
import { getPreviewResponse } from '@/lib/previewData';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const TOKEN_STORAGE_KEY = 'track_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON-serializable body; set automatically with the JSON content type. */
  json?: unknown;
  /** Raw, already-serialized body (e.g. URL-encoded form data). */
  rawBody?: string;
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, rawBody, headers, ...rest } = options;

  // Preview mode (no backend): serve baked demo fixtures instead of fetching.
  if (PREVIEW_MODE) {
    const method = (rest.method ?? 'GET').toUpperCase();
    return getPreviewResponse(method, path, json) as T;
  }

  const token = getToken();

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
  } else if (rawBody !== undefined) {
    init.body = rawBody;
  }

  const res = await fetch(`${BASE_URL}${path}`, init);

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    const message =
      (payload && typeof payload === 'object' && 'detail' in payload
        ? String((payload as { detail: unknown }).detail)
        : res.statusText) || 'Request failed';
    throw new ApiError(res.status, message, payload);
  }

  return payload as T;
}

export const apiClient = {
  baseUrl: BASE_URL,
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, json?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'POST', json }),
  put: <T>(path: string, json?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', json }),
  patch: <T>(path: string, json?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', json }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  /** POST form-urlencoded (used by the OAuth2 login endpoint). */
  postForm: <T>(path: string, form: Record<string, string>) =>
    request<T>(path, {
      method: 'POST',
      rawBody: new URLSearchParams(form).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
};
