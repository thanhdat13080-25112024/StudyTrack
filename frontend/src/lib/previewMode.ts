/**
 * Preview mode — a build-time flag (`VITE_PREVIEW_MODE=true`, set only on the
 * Vercel preview build) that lets visitors browse the whole app WITHOUT a
 * backend or a login. When on:
 *   - the auth gate is bypassed via a synthetic session (authStore seeds a
 *     dummy token), so RequireAuth + the route redirects treat the visitor as
 *     signed in;
 *   - `apiClient` short-circuits every request and serves baked demo fixtures
 *     (see `lib/previewData.ts`) instead of hitting `/api/*` (which 404s with no
 *     backend);
 *   - the notification WebSocket is skipped (nothing to connect to).
 *
 * It is OFF on the real VPS build, where login + the live backend take over.
 * Removed entirely once the app is fully served from the VPS.
 */
export const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === 'true';

/** Synthetic token seeded into the auth store in preview mode so the app treats
 * the visitor as authenticated. Never leaves the browser — apiClient intercepts
 * every call before the Authorization header would be used. */
export const PREVIEW_TOKEN = 'preview-mode';
