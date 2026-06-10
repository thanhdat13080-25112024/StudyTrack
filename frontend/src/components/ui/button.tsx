import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Notion-style Button. Variants reference design tokens (accent / border /
 * bg-card) wired to the palette — never raw hex — so light/dark match
 * automatically. `primary` is the no-prop default (pill, accent fill);
 * `outline` is kept as a back-compat alias of `secondary`.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[colors,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'rounded-pill bg-accent text-white hover:bg-accent-hover active:scale-[.97]',
        secondary:
          'rounded-pill bg-bg-card border border-border text-text-helper shadow-soft hover:bg-menu-item',
        // Back-compat alias: existing call sites pass variant="outline" for
        // secondary actions — keep it rendering the secondary styling.
        outline:
          'rounded-pill bg-bg-card border border-border text-text-helper shadow-soft hover:bg-menu-item',
        // Back-compat alias: any explicit variant="default" maps to primary.
        default: 'rounded-pill bg-accent text-white hover:bg-accent-hover active:scale-[.97]',
        utility: 'rounded-md border border-border bg-bg-card text-text-helper hover:bg-menu-item',
        ghost: 'rounded-pill text-text-main hover:bg-menu-item',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
