/**
 * ProductivityGauge — SVG circular gauge showing a 0–100 productivity score
 * with animated fill and component breakdown.
 */
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import type { ProductivityScore } from '@/features/analytics/types';

interface ProductivityGaugeProps {
  data: ProductivityScore;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-brand-emerald';
  if (score >= 50) return 'text-accent';
  if (score >= 25) return 'text-brand-gold';
  return 'text-brand-rose';
}

function strokeColor(score: number): string {
  if (score >= 80) return 'var(--brand-emerald)';
  if (score >= 50) return 'var(--accent-color)';
  if (score >= 25) return 'var(--brand-gold)';
  return 'var(--brand-rose)';
}

export function ProductivityGauge({ data }: ProductivityGaugeProps) {
  const { t } = useTranslation();
  const { score, components } = data;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  const items = [
    { key: 'consistency', value: components.consistency },
    { key: 'volume', value: components.volume },
    { key: 'focusQuality', value: components.focus_quality },
  ];

  return (
    <Card className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start sm:gap-8">
      {/* Gauge */}
      <div className="relative flex-shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="10"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={strokeColor(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 80 80)"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
          <span className="text-xs text-text-muted">/100</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-helper">
          {t('analytics.productivityComponents')}
        </h3>
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-6 text-sm">
              <span className="text-text-muted">{t(`analytics.${item.key}`)}</span>
              <span className="font-medium text-text-helper">{item.value.toFixed(0)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(item.value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
