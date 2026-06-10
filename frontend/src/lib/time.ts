/** Time + timer-progress helpers shared by the timer UI. */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Fraction of the planned time still remaining, clamped to [0,1]. */
export function ringProgress(secondsLeft: number, planned: number): number {
  if (planned <= 0) return 0;
  return Math.min(1, Math.max(0, secondsLeft / planned));
}

/** Format whole seconds → "HH:MM:SS" (port of legacy `renderTimerDisplay`). */
export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Local calendar date as "YYYY-MM-DD", built from the wall-clock fields (NOT
 * toISOString, which would shift across the UTC boundary). This is the
 * `session_date` the backend keys streak/KPI/chart computation off.
 */
export function localDateISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
