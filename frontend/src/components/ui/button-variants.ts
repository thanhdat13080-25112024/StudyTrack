import { cva } from 'class-variance-authority';

/**
 * Notion-style Button variants. Lives in its own module (not `button.tsx`) so
 * the component file only exports components — keeping react-refresh / fast
 * refresh happy. Variants reference design tokens (accent / border / bg-card)
 * wired to the palette — never raw hex — so light/dark match automatically.
 * `primary` is the no-prop default (pill, accent fill); `outline` is kept as a
 * back-compat alias of `secondary`.
 */
// Hoisted so the byte-identical pill styles live in one place: `primary`
// shares PILL_PRIMARY, and `secondary`/`outline` share PILL_SECONDARY.
const PILL_PRIMARY = 'rounded-pill bg-accent text-white hover:bg-accent-hover';
const PILL_SECONDARY =
  'rounded-pill bg-bg-card border border-border text-text-helper shadow-soft hover:bg-menu-item';

// Press micro-feedback lives in the base string so EVERY variant gets the same
// tactile scale; `motion-safe:` gates it behind prefers-reduced-motion at the
// CSS layer (no JS needed — this is the interaction-feedback layer of the
// motion system; see lib/motion.ts for the GSAP layers).
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 motion-safe:active:scale-[.97]',
  {
    variants: {
      variant: {
        primary: PILL_PRIMARY,
        secondary: PILL_SECONDARY,
        // Back-compat alias: existing call sites pass variant="outline" for
        // secondary actions — keep it rendering the secondary styling.
        outline: PILL_SECONDARY,
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
