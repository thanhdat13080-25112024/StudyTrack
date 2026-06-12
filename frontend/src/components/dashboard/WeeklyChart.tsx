/**
 * WeeklyChart — 7-day study-minutes bar chart (Recharts), port of the legacy
 * Chart.js weekly chart. Reads the dashboard `chart: {date,minutes}[]` (oldest
 * → newest, last = today). Bar/grid/axis colors come from the live CSS-var
 * tokens so the chart recolors with the light/dark theme.
 */
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/components/charts/chartTheme';
import type { Dashboard } from '@/features/sessions/types';

type ChartPoint = Dashboard['chart'][number];

// `Date.getDay()`-ordered (Sun=0), distinct from the schedule's Mon-first DAY_KEYS.
const JS_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

interface WeeklyChartProps {
  data: ChartPoint[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const { t } = useTranslation();
  const { accent, grid, text, tooltipStyle } = useChartTheme();

  const rows = data.map((p) => {
    const d = new Date(`${p.date}T00:00:00`);
    return { label: t(`days.${JS_DAY_KEYS[d.getDay()]}Short`), minutes: p.minutes };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="label" stroke={text} tickLine={false} fontSize={12} />
          <YAxis stroke={text} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            cursor={{ fill: grid, opacity: 0.3 }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
          />
          <Bar dataKey="minutes" fill={accent} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
