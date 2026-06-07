/**
 * WeeklyChart — 7-day study-minutes bar chart (Recharts), port of the legacy
 * Chart.js weekly chart. Reads the dashboard `chart: {date,minutes}[]` (oldest
 * → newest, last = today). Bar/grid/axis colors come from the live CSS-var
 * tokens so the chart recolors with the light/dark theme.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useUiStore } from '@/store/uiStore';
import type { Dashboard } from '@/features/sessions/types';

type ChartPoint = Dashboard['chart'][number];

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

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
  const [colors, setColors] = useState({ bar: '#2563eb', grid: '#1e293b', text: '#9ca3af' });

  useEffect(() => {
    setColors({
      bar: readVar('--accent-color', '#2563eb'),
      grid: readVar('--border-color', '#1e293b'),
      text: readVar('--text-helper', '#9ca3af'),
    });
  }, [theme]);

  const rows = data.map((p) => {
    const d = new Date(`${p.date}T00:00:00`);
    return { label: t(`days.${DAY_KEYS[d.getDay()]}Short`), minutes: p.minutes };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis dataKey="label" stroke={colors.text} tickLine={false} fontSize={12} />
          <YAxis stroke={colors.text} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            cursor={{ fill: colors.grid, opacity: 0.3 }}
            contentStyle={{
              background: readVar('--bg-card', '#1e293b'),
              border: `1px solid ${colors.grid}`,
              borderRadius: 12,
              color: colors.text,
            }}
            formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
          />
          <Bar dataKey="minutes" fill={colors.bar} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
