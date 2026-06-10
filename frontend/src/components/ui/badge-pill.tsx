import * as React from 'react';
import { cn } from '@/lib/utils';

export const BadgePill = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-pill bg-bg-card text-accent text-xs font-semibold uppercase tracking-eyebrow px-2 py-1',
        className,
      )}
      {...props}
    />
  ),
);
BadgePill.displayName = 'BadgePill';
