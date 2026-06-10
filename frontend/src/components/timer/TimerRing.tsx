import { motion, useReducedMotion } from 'framer-motion';
import { ringProgress } from '@/lib/time';

interface TimerRingProps {
  secondsLeft: number;
  planned: number;
  /** Diameter in px. */
  size?: number;
  children: React.ReactNode;
}

/**
 * Animated SVG progress ring for the Focus "night" state. The ring drains as
 * time elapses; on the indigo backdrop the track is faint white and the
 * progress arc is the accent blue. A gentle pulse plays while running unless
 * reduced motion is requested.
 */
export function TimerRing({ secondsLeft, planned, size = 280, children }: TimerRingProps) {
  const reduced = useReducedMotion();
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - ringProgress(secondsLeft, planned));

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={reduced ? undefined : { scale: [1, 1.012, 1] }}
      transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduced ? 0 : 0.9, ease: 'linear' }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">{children}</div>
    </motion.div>
  );
}
