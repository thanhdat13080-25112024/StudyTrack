/**
 * GpaTrendChart — semester-GPA trend (Recharts LineChart). Plots the GPA summary
 * `semesters` (x = code, y = gpa). Colors come from the live CSS-var tokens so it
 * recolors with the light/dark theme (same approach as the Phase-2 WeeklyChart).
 * Renders nothing with fewer than 2 semesters (a single point is not a trend).
 */
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useChartTheme } from '@/components/charts/chartTheme';
import { Card } from '@/components/ui/card';
import type { GpaSummary } from '@/features/grades/types';

interface GpaTrendChartProps {
  semesters: GpaSummary['semesters'];
}

export function GpaTrendChart({ semesters }: GpaTrendChartProps) {
  const { t } = useTranslation();
  const { accent, grid, text, tooltipStyle } = useChartTheme();

  if (semesters.length < 2) return null;

  const rows = semesters.map((s) => ({ label: s.code, gpa: s.gpa }));

  return (
    <Card className="flex flex-col gap-3 p-6">
      <h2 className="text-sm font-semibold text-text-helper">{t('gpa.trendTitle')}</h2>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="label" stroke={text} tickLine={false} fontSize={12} />
            <YAxis
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              stroke={text}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <Tooltip
              cursor={{ stroke: grid }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [value.toFixed(2), t('gpa.cpa')]}
            />
            <Line
              type="monotone"
              dataKey="gpa"
              stroke={accent}
              strokeWidth={2}
              dot={{ r: 4, fill: accent }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
