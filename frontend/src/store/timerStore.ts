/**
 * Timer store — port of the legacy focus-session timer (`totalSecondsLeft`,
 * `initialSecondsPlanned`, `isTimerRunning`).
 *
 * Server state lives in TanStack Query; the running timer is client-only UI
 * state and lives here in Zustand. It is persisted to localStorage (key
 * `track_timer`) so a refresh mid-session can resume the timer UI (the Focus
 * page reads `running` + `secondsLeft` on mount). One completed session is
 * recorded via `POST /api/sessions` when the timer stops (see pages/Focus.tsx).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudyMethod } from '@/features/sessions/types';

export interface TimerConfig {
  subject: string;
  minutes: number;
  focus: number;
  method: StudyMethod;
  note: string;
}

interface TimerState {
  subject: string;
  focus: number;
  method: StudyMethod;
  note: string;
  plannedSeconds: number;
  secondsLeft: number;
  running: boolean;
  /** ISO timestamp of the first `start()` for this session, or null. */
  startedAt: string | null;
  configure: (cfg: TimerConfig) => void;
  start: () => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  elapsedSeconds: () => number;
}

const DEFAULTS = {
  subject: '',
  focus: 8,
  method: 'Pomodoro' as StudyMethod,
  note: '',
  plannedSeconds: 0,
  secondsLeft: 0,
  running: false,
  startedAt: null as string | null,
};

/**
 * Legacy `stopCountdown` rounding: floor to minutes, round up if the leftover
 * seconds are >= 30, and floor to a minimum of 1 minute if any time elapsed.
 */
export function computeActualMinutes(elapsedSeconds: number): number {
  let m = Math.floor(elapsedSeconds / 60);
  if (elapsedSeconds % 60 >= 30) m++;
  if (elapsedSeconds > 0 && m === 0) m = 1;
  return m;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      configure: (cfg) =>
        set({
          subject: cfg.subject,
          focus: cfg.focus,
          method: cfg.method,
          note: cfg.note,
          plannedSeconds: cfg.minutes * 60,
          secondsLeft: cfg.minutes * 60,
          running: false,
          startedAt: null,
        }),
      start: () =>
        set((s) => ({
          running: true,
          startedAt: s.startedAt ?? new Date().toISOString(),
        })),
      tick: () =>
        set((s) =>
          s.running && s.secondsLeft > 0 ? { secondsLeft: s.secondsLeft - 1 } : {},
        ),
      pause: () => set({ running: false }),
      resume: () =>
        set((s) => ({ running: true, startedAt: s.startedAt ?? new Date().toISOString() })),
      stop: () => set({ running: false }),
      reset: () => set({ ...DEFAULTS }),
      elapsedSeconds: () => {
        const s = get();
        return s.plannedSeconds - s.secondsLeft;
      },
    }),
    {
      name: 'track_timer',
      // Persist only serializable session data (actions are recreated on load).
      partialize: (s) => ({
        subject: s.subject,
        focus: s.focus,
        method: s.method,
        note: s.note,
        plannedSeconds: s.plannedSeconds,
        secondsLeft: s.secondsLeft,
        running: s.running,
        startedAt: s.startedAt,
      }),
    },
  ),
);
