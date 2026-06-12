import { useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { EASE, usePrefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

/** Counts up from 0 → value on mount; instant under reduced motion. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useGSAP(
    () => {
      if (reduced) {
        setDisplay(value);
        return;
      }
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: value,
        duration: 0.8,
        ease: EASE.count,
        onUpdate: () => setDisplay(proxy.v),
      });
    },
    { dependencies: [value, reduced] },
  );

  return (
    <span className={cn('tabular-nums', className)}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
