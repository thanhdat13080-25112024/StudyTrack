/**
 * GpaTrendChart — semester-GPA trend (Recharts LineChart). Plots the GPA summary
 * `semesters` (x = code, y = gpa). Colors come from the live CSS-var tokens so it
 * recolors with the light/dark theme (same approach as the Phase-2 WeeklyChart).
 * Renders nothing with fewer than 2 semesters (a single point is not a trend).
 */
import { useEffect, useState } from 'react';
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
import { useUiStore } from '@/store/uiStore';
import type { GpaSummary } from '@/features/grades/types';

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

interface GpaTrendChartProps {
  semesters: GpaSummary['semesters'];
}

export function GpaTrendChart({ semesters }: GpaTrendChartProps) {
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const [colors, setColors] = useState({ line: '#2563eb', grid: '#1e293b', text: '#9ca3af' });

  useEffect(() => {
    setColors({
      line: readVar('--accent-color', '#2563eb'),
      grid: readVar('--border-color', '#1e293b'),
      text: readVar('--text-helper', '#9ca3af'),
    });
  }, [theme]);

  if (semesters.length < 2) return null;

  const rows = semesters.map((s) => ({ label: s.code, gpa: s.gpa }));

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-bg-card p-6 shadow-card">
      <h2 className="text-sm font-semibold text-text-helper">{t('gpa.trendTitle')}</h2>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="label" stroke={colors.text} tickLine={false} fontSize={12} />
            <YAxis
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              stroke={colors.text}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <Tooltip
              cursor={{ stroke: colors.grid }}
              contentStyle={{
                background: readVar('--bg-card', '#1e293b'),
                border: `1px solid ${colors.grid}`,
                borderRadius: 12,
                color: colors.text,
              }}
              formatter={(value: number) => [value.toFixed(2), t('gpa.cpa')]}
            />
            <Line
              type="monotone"
              dataKey="gpa"
              stroke={colors.line}
              strokeWidth={2}
              dot={{ r: 4, fill: colors.line }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
