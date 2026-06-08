/**
 * StudyHeatmap — a 365-day GitHub-style calendar heatmap built with CSS grid.
 * Uses Tailwind theme tokens for intensity levels (adapts to light/dark).
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { HeatmapPoint } from '@/features/analytics/types';

interface StudyHeatmapProps {
  data: HeatmapPoint[];
  year: number;
}

/** Map of "YYYY-MM-DD" → minutes */
function buildLookup(data: HeatmapPoint[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of data) m.set(p.date, p.minutes);
  return m;
}

/** All days in the year grouped by week (Mon-first ISO weeks). */
function buildWeeks(year: number): Date[][] {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const weeks: Date[][] = [];
  let current: Date[] = [];
  const d = new Date(start);
  // Pad the first week so it aligns to Monday
  const firstDow = (d.getDay() + 6) % 7; // 0=Mon
  for (let i = 0; i < firstDow; i++) current.push(new Date(0)); // placeholder
  while (d <= end) {
    const dow = (d.getDay() + 6) % 7;
    if (dow === 0 && current.length > 0) {
      weeks.push(current);
      current = [];
    }
    current.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  if (current.length > 0) weeks.push(current);
  return weeks;
}

function intensityClass(minutes: number): string {
  if (minutes === 0) return 'bg-border/40';
  if (minutes < 30) return 'bg-accent/20';
  if (minutes < 60) return 'bg-accent/40';
  if (minutes < 120) return 'bg-accent/60';
  return 'bg-accent/90';
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function StudyHeatmap({ data, year }: StudyHeatmapProps) {
  const { t } = useTranslation();
  const lookup = useMemo(() => buildLookup(data), [data]);
  const weeks = useMemo(() => buildWeeks(year), [year]);

  // Find which weeks correspond to month boundaries for labels
  const monthStarts = useMemo(() => {
    const result: { weekIdx: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      for (const d of week) {
        if (d.getTime() === 0) continue;
        const m = d.getMonth();
        if (m !== lastMonth) {
          result.push({ weekIdx: wi, label: MONTH_LABELS[m] });
          lastMonth = m;
          break;
        }
      }
    });
    return result;
  }, [weeks]);

  return (
    <div className="flex flex-col gap-2">
      {/* Month labels */}
      <div className="flex text-xs text-text-muted" style={{ paddingLeft: 28 }}>
        {monthStarts.map((ms, i) => {
          const nextIdx = monthStarts[i + 1]?.weekIdx ?? weeks.length;
          const span = nextIdx - ms.weekIdx;
          return (
            <span
              key={ms.label + ms.weekIdx}
              style={{ width: `${span * 14}px` }}
              className="flex-shrink-0"
            >
              {ms.label}
            </span>
          );
        })}
      </div>

      <div className="flex gap-0.5">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-0.5 pr-1 text-[10px] text-text-muted">
          <span className="h-[12px]" />
          <span className="flex h-[12px] items-center">M</span>
          <span className="h-[12px]" />
          <span className="flex h-[12px] items-center">W</span>
          <span className="h-[12px]" />
          <span className="flex h-[12px] items-center">F</span>
          <span className="h-[12px]" />
        </div>

        {/* Grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }, (_, di) => {
                const d = week[di];
                if (!d || d.getTime() === 0) {
                  return <div key={di} className="h-[12px] w-[12px]" />;
                }
                const dateStr = formatDate(d);
                const mins = lookup.get(dateStr) ?? 0;
                return (
                  <div
                    key={di}
                    className={`h-[12px] w-[12px] rounded-[2px] transition-colors ${intensityClass(mins)}`}
                    title={t('analytics.heatmapTooltip', { minutes: mins, date: dateStr })}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-1.5 text-[10px] text-text-muted"
        style={{ paddingLeft: 28 }}
      >
        <span>{t('analytics.lessActive')}</span>
        <div className="h-[10px] w-[10px] rounded-[2px] bg-border/40" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-accent/20" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-accent/40" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-accent/60" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-accent/90" />
        <span>{t('analytics.moreActive')}</span>
      </div>
    </div>
  );
}
