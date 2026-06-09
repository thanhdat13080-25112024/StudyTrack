/**
 * WeeklyChart — 7-day study-minutes bar chart (Recharts), port of the legacy
 * Chart.js weekly chart. Reads the dashboard `chart: {date,minutes}[]` (oldest
 * → newest, last = today). Bar/grid/axis colors come from the live CSS-var
 * tokens so the chart recolors with the light/dark theme.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useUiStore } from '@/store/uiStore';
import type { Dashboard } from '@/features/sessions/types';

type ChartPoint = Dashboard['chart'][number];

// `Date.getDay()`-ordered (Sun=0), distinct from the schedule's Mon-first DAY_KEYS.
const JS_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

interface WeeklyChartProps {
  data: ChartPoint[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const { t } = useTranslation();
  // Re-read tokens whenever the theme flips.
  const theme = useUiStore((s) => s.theme);
  const [colors, setColors] = useState({ bar: '#0075de', grid: '#e6e6e6', text: '#615d59' });

  useEffect(() => {
    setColors({
      bar: '#0075de', // Notion Primary Blue
      grid: readVar('--hairline', '#e6e6e6'),
      text: readVar('--ink-muted', '#615d59'),
    });
  }, [theme]);

  const rows = data.map((p) => {
    const d = new Date(`${p.date}T00:00:00`);
    return { label: t(`days.${JS_DAY_KEYS[d.getDay()]}Short`), minutes: p.minutes };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis dataKey="label" stroke={colors.text} tickLine={false} axisLine={false} fontSize={12} fontWeight={500} />
          <YAxis stroke={colors.text} tickLine={false} axisLine={false} fontSize={12} fontWeight={500} />
          <Tooltip
            cursor={{ fill: colors.grid, opacity: 0.3 }}
            contentStyle={{
              background: readVar('--surface', '#ffffff'),
              border: `1px solid ${colors.grid}`,
              borderRadius: 8,
              boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
              color: readVar('--ink', '#000000'),
              fontSize: 12,
              fontWeight: 600,
            }}
            formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
          />
          <Bar dataKey="minutes" fill={colors.bar} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
