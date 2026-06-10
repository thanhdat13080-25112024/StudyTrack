/**
 * Focus page — port of the legacy focus-session timer
 * (`triggerManualStart` / `startCountdown` / `pauseCountdown` / `stopCountdown`).
 *
 * The running timer is client-only state in `useTimerStore` (persisted to
 * localStorage so a refresh mid-session resumes the UI). On stop, one completed
 * session is recorded via `POST /api/sessions`; `session_date` is the LOCAL
 * calendar date (`localDateISO`) so streak/KPI/chart bucketing matches the
 * user's day, not UTC. A natural finish (timer hits 0) fires confetti.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/timer/Timer';
import { TimerRing } from '@/components/timer/TimerRing';
import { MusicPlayer } from '@/components/timer/MusicPlayer';
import { SessionForm, type SessionFormValues } from '@/components/sessions/SessionForm';
import { useCourses } from '@/features/courses/hooks';
import { useCreateSession, useSuggestion } from '@/features/sessions/hooks';
import { renderSuggestion } from '@/features/sessions/suggestion';
import { useTimerStore, computeActualMinutes } from '@/store/timerStore';
import { localDateISO } from '@/lib/time';

const DEFAULT_FORM: SessionFormValues = {
  subject: '',
  minutes: 25,
  focus: 8,
  method: 'Pomodoro',
  note: '',
  courseId: null,
};

export default function Focus() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const timer = useTimerStore();
  const createSession = useCreateSession();
  const suggestion = useSuggestion();
  const { data: courses } = useCourses();

  const [form, setForm] = useState<SessionFormValues>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = window.setInterval(() => {
      useTimerStore.getState().tick();
    }, 1000);
  }, [clearTick]);

  /** Persist the completed session (if any time elapsed), then reset + leave. */
  const finalize = useCallback(
    (finishedNaturally: boolean) => {
      clearTick();
      document.body.classList.remove('focus-active');
      const state = useTimerStore.getState();
      const actual = computeActualMinutes(state.elapsedSeconds());
      const subject = state.subject;

      const fireConfettiThenLeave = () => {
        if (finishedNaturally) {
          try {
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
          } catch {
            // confetti is best-effort; ignore if unavailable.
          }
        }
        useTimerStore.getState().reset();
        navigate('/dashboard');
      };

      if (actual > 0 && subject) {
        // Keep the timer state + this page on error so the inline error shows;
        // only reset + navigate once the session is recorded.
        createSession.mutate(
          {
            subject,
            planned_minutes: Math.round(state.plannedSeconds / 60),
            actual_minutes: actual,
            focus: state.focus,
            method: state.method,
            note: state.note,
            session_date: localDateISO(),
            started_at: state.startedAt ?? new Date().toISOString(),
            ended_at: new Date().toISOString(),
            course_id: state.courseId,
          },
          { onSuccess: fireConfettiThenLeave },
        );
      } else {
        fireConfettiThenLeave();
      }
    },
    [clearTick, createSession, navigate],
  );

  // On mount: resume the timer UI if a running session survived a refresh.
  useEffect(() => {
    const s = useTimerStore.getState();
    if (s.running && s.secondsLeft === 0 && s.plannedSeconds > 0) {
      // Edge: closed exactly at finish — rehydrated frozen at 00:00:00. The
      // tick won't restart (needs secondsLeft>0) and auto-stop won't fire, so
      // finalize here (natural-finish path) to save + navigate instead of freeze.
      finalize(true);
    } else if (s.running && s.secondsLeft > 0) {
      startTick();
    }
    return clearTick;
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-stop when the timer naturally reaches zero.
  useEffect(() => {
    if (timer.plannedSeconds > 0 && timer.secondsLeft === 0 && intervalRef.current !== null) {
      finalize(true);
    }
  }, [timer.secondsLeft, timer.plannedSeconds, finalize]);

  // Debounced live suggestion when the form has a valid subject + duration.
  useEffect(() => {
    if (timer.running) return;
    if (!form.subject.trim() || form.minutes <= 0) {
      setSuggestionText(null);
      return;
    }
    const handle = window.setTimeout(() => {
      suggestion.mutate(
        { method: form.method, focus: form.focus, planned_minutes: form.minutes },
        { onSuccess: (data) => setSuggestionText(renderSuggestion(t, data)) },
      );
    }, 400);
    return () => window.clearTimeout(handle);
    // suggestion mutation identity is stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subject, form.minutes, form.focus, form.method, timer.running, t]);

  const handleChange = (patch: Partial<SessionFormValues>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleStart = () => {
    if (!form.subject.trim() || form.minutes <= 0) {
      setError(t('focus.invalid'));
      return;
    }
    setError(null);
    setSuggestionText(null);
    timer.configure(form);
    timer.start();
    document.body.classList.add('focus-active');
    startTick();
  };

  const handlePause = () => {
    timer.pause();
    clearTick();
  };

  const handleResume = () => {
    timer.resume();
    startTick();
  };

  const isRunning = timer.plannedSeconds > 0 && (timer.running || timer.secondsLeft > 0);

  return (
    <div className="flex flex-col gap-8">
      {!isRunning ? (
        <section className="rounded-card border border-border bg-bg-card p-8">
          <h1 className="mb-6 text-xl font-bold tracking-heading text-text-main">
            {t('focus.title')}
          </h1>
          <SessionForm
            values={form}
            onChange={handleChange}
            onStart={handleStart}
            error={error}
            suggestion={suggestionText}
            courses={courses ?? []}
          />
        </section>
      ) : (
        <section className="flex flex-col items-center gap-8 rounded-xl bg-secondary p-10 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-eyebrow text-white/70">
            {t('focus.heading')}
          </p>
          <p className="text-lg font-medium text-white">{timer.subject}</p>
          <TimerRing secondsLeft={timer.secondsLeft} planned={timer.plannedSeconds}>
            <Timer secondsLeft={timer.secondsLeft} className="text-white text-5xl md:text-6xl" />
          </TimerRing>
          <div className="flex gap-3">
            {timer.running ? (
              <Button variant="secondary" size="lg" onClick={handlePause}>
                <Pause className="h-4 w-4" aria-hidden />
                {t('focus.pause')}
              </Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={handleResume}>
                <Play className="h-4 w-4" aria-hidden />
                {t('focus.resume')}
              </Button>
            )}
            <Button size="lg" onClick={() => finalize(false)}>
              <Square className="h-4 w-4" aria-hidden />
              {t('focus.stop')}
            </Button>
          </div>
          {createSession.isError && (
            <span className="text-sm text-red-300">{t('common.actionFailed')}</span>
          )}
          <div className="w-full max-w-md">
            <MusicPlayer autoPlay />
          </div>
        </section>
      )}
    </div>
  );
}
