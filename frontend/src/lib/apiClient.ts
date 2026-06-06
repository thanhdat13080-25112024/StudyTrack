/**
 * Minimal fetch wrapper for the StudyTrack backend.
 *
 * baseURL comes from `import.meta.env.VITE_API_URL` (set per environment).
 * Request/response shapes will be typed against `lib/api-types.ts`
 * (generated from the backend OpenAPI) once endpoints are wired in Phase 1+.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

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
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    credentials: 'include',
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }

  const res = await fetch(`${BASE_URL}${path}`, init);

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
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
};
