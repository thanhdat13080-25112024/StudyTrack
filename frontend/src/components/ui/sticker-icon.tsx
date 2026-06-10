import * as React from 'react';
import { cn } from '@/lib/utils';

/** Decorative colored icon tile (Notion "sticker" palette). Decoration only —
 * never used to paint a CTA or structural action.
 *
 * @param color — a 6-digit hex (#rrggbb) from the sticker palette; the function
 *   appends an alpha byte (`1f`) for the tinted background, which only produces
 *   a valid 8-digit `#rrggbbaa` when `color` is exactly 6 hex digits. Callers
 *   pass `sticker.*` 6-digit hexes.
 */
export function StickerIcon({
  icon: Icon,
  color,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex h-10 w-10 items-center justify-center rounded-md', className)}
      style={{ backgroundColor: `${color}1f`, color }}
      aria-hidden
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
