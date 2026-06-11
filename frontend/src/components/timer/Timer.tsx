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
        // Size is tuned to sit inside the focus ring (~280px); tracking-tight +
        // tabular-nums keep the HH:MM:SS readout from overflowing the circle.
        'font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl ' +
        (className ?? 'text-text-main')
      }
      role="timer"
      aria-live="off"
    >
      {formatSeconds(secondsLeft)}
    </div>
  );
}
