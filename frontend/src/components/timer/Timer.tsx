/**
 * Timer — presentational HH:MM:SS readout (port of legacy `renderTimerDisplay`).
 * Props in, no data fetching; the Focus page owns the timer store + interval.
 */
import { formatSeconds } from '@/lib/time';

interface TimerProps {
  secondsLeft: number;
  className?: string;
}

export function Timer({ secondsLeft, className }: TimerProps) {
  return (
    <div
      className={
        'font-mono text-7xl font-bold tabular-nums tracking-tighter text-ink md:text-8xl ' +
        (className ?? '')
      }
      role="timer"
      aria-live="off"
    >
      {formatSeconds(secondsLeft)}
    </div>
  );
}
