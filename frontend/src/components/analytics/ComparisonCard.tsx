/**
 * ComparisonCard — reusable card showing current vs previous period
 * with delta percentage and directional indicator.
 */
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ComparisonCardProps {
  label: string;
  sublabel: string;
  current: number;
  previous: number;
  changePct: number | null;
  formatValue?: (v: number) => string;
}

export function ComparisonCard({
  label,
  sublabel,
  current,
  previous,
  changePct,
  formatValue = (v) => `${(v / 60).toFixed(1)}h`,
}: ComparisonCardProps) {
  const isUp = changePct !== null && changePct > 0;
  const isDown = changePct !== null && changePct < 0;
  const isFlat = changePct !== null && changePct === 0;

  return (
    <Card className="flex flex-col gap-2 p-5">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-3xl font-bold text-text-helper">{formatValue(current)}</span>
      <div className="flex items-center gap-1.5 text-sm">
        {isUp && <ArrowUp className="h-4 w-4 text-sticker-green" aria-hidden />}
        {isDown && <ArrowDown className="h-4 w-4 text-red-500" aria-hidden />}
        {isFlat && <Minus className="h-4 w-4 text-text-muted" aria-hidden />}
        {changePct !== null ? (
          <span
            className={
              isUp
                ? 'font-medium text-sticker-green'
                : isDown
                  ? 'font-medium text-red-500'
                  : 'text-text-muted'
            }
          >
            {isUp ? '+' : ''}
            {changePct.toFixed(1)}%
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
        <span className="text-text-muted">
          {sublabel} ({formatValue(previous)})
        </span>
      </div>
    </Card>
  );
}
