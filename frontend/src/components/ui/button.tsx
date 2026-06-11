import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';

/**
 * Notion-style Button. The cva `buttonVariants` def lives in the sibling
 * `button-variants.ts` so this file only exports components (react-refresh).
 * Variants reference design tokens (accent / border / bg-card) wired to the
 * palette — never raw hex — so light/dark match automatically. `primary` is the
 * no-prop default (pill, accent fill); `outline` is a back-compat alias of
 * `secondary`.
 */
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

export { Button };
