import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Pure formatter — kept separate so it is unit-testable without animation. */
export function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

/** Counts up from 0 → value on mount; instant under reduced motion. */
export function AnimatedNumber({ value, decimals = 0, suffix = '', className }: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span className={cn('tabular-nums', className)}>
      {formatNumber(display, decimals)}
      {suffix}
    </span>
  );
}
