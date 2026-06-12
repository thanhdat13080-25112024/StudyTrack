import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/lib/motion';
import { ringProgress } from '@/lib/time';

interface TimerRingProps {
  secondsLeft: number;
  planned: number;
  /** Diameter in px. */
  size?: number;
  children: React.ReactNode;
}

/**
 * Animated SVG progress ring for the Focus "night" state. The arc drains as
 * time elapses (eased to each new offset); a gentle infinite pulse plays while
 * running unless reduced motion is requested.
 */
export function TimerRing({ secondsLeft, planned, size = 280, children }: TimerRingProps) {
  const reduced = usePrefersReducedMotion();
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - ringProgress(secondsLeft, planned));

  const wrapRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);

  // Gentle pulse on the wrapper (skipped under reduced motion).
  useGSAP(
    () => {
      if (reduced || !wrapRef.current) return;
      gsap.to(wrapRef.current, {
        scale: 1.012,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    },
    { dependencies: [reduced], scope: wrapRef },
  );

  // Tween the arc to the latest offset on each tick (instant under reduced).
  useGSAP(
    () => {
      if (!arcRef.current) return;
      gsap.to(arcRef.current, {
        strokeDashoffset: offset,
        duration: reduced ? 0 : 0.9,
        ease: 'none',
      });
    },
    { dependencies: [offset, reduced] },
  );

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
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
        <circle
          ref={arcRef}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          // On the indigo night band every signal is on-primary white (DESIGN.md
          // hero-band); structural blue stays reserved for paper surfaces.
          stroke="#ffffff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">{children}</div>
    </div>
  );
}
