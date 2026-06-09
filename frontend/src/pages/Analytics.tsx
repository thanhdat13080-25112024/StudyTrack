/**
 * Analytics page — rich study-habit analytics with charts, heatmap, and
 * productivity score. All data is computed on-read from the backend;
 * this page only renders it.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppHeader } from '@/components/AppHeader';
import { ComparisonCard } from '@/components/analytics/ComparisonCard';
import { ProductivityGauge } from '@/components/analytics/ProductivityGauge';
import { StudyHeatmap } from '@/components/analytics/StudyHeatmap';
import { Card } from '@/components/ui/card';
import { useAnalytics } from '@/features/analytics/hooks';
import { useUiStore } from '@/store/uiStore';

// Theme-aware CSS variable reader
function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const PIE_COLORS = [
  '#0075de', // primary
  '#1aae39', // sticker-green
  '#dd5b00', // sticker-orange
  '#ff64c8', // sticker-pink
  '#d6b6f6', // sticker-purple
];

type DateRange = 'all' | '30' | '90' | 'year';

function rangeToParams(range: DateRange): { fromDate?: string; toDate?: string } {
  if (range === 'all') return {};
  const now = new Date();
  if (range === 'year') {
    return { fromDate: `${now.getFullYear()}-01-01` };
  }
  const days = range === '30' ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { fromDate: from.toISOString().slice(0, 10) };
}

export default function Analytics() {
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const [range, setRange] = useState<DateRange>('all');
  const params = useMemo(() => rangeToParams(range), [range]);
  const { data, isLoading } = useAnalytics(params.fromDate, params.toDate);

  const [colors, setColors] = useState({
    accent: '#0075de',
    grid: '#e6e6e6',
    text: '#615d59',
    card: '#ffffff',
  });

  useEffect(() => {
    setColors({
      accent: '#0075de',
      grid: readVar('--hairline', '#e6e6e6'),
      text: readVar('--ink-muted', '#615d59'),
      card: readVar('--surface', '#ffffff'),
    });
  }, [theme]);

  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-full bg-canvas-soft text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <AppHeader />

        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{t('analytics.title')}</h1>

          {/* Date range selector */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mr-1">{t('analytics.dateRange')}:</span>
            {(['all', '30', '90', 'year'] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all border ${
                  range === r
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-ink-secondary border-hairline hover:bg-canvas-soft hover:text-ink'
                }`}
              >
                {t(`analytics.${r === 'all' ? 'allTime' : r === 'year' ? 'thisYear' : `last${r}`}`)}
              </button>
            ))}
          </div>
        </section>

        {isLoading || !data ? (
          <p className="text-ink-muted">{t('common.loading')}</p>
        ) : data.time_by_method.length === 0 &&
          data.time_by_course.length === 0 &&
          data.focus_trend.length === 0 ? (
          <Card className="p-12 text-center text-ink-muted border-dashed border-hairline shadow-none bg-canvas-soft/50 font-medium">{t('analytics.noData')}</Card>
        ) : (
          <>
            {/* Row 1: Comparison cards + Productivity gauge */}
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ComparisonCard
                label={t('analytics.weekComparison')}
                sublabel={t('analytics.vsLastWeek')}
                current={data.weekly_comparison.this_week_minutes}
                previous={data.weekly_comparison.last_week_minutes}
                changePct={data.weekly_comparison.change_pct}
              />
              <ComparisonCard
                label={t('analytics.monthComparison')}
                sublabel={t('analytics.vsLastMonth')}
                current={data.monthly_comparison.this_month_minutes}
                previous={data.monthly_comparison.last_month_minutes}
                changePct={data.monthly_comparison.change_pct}
              />
              <div className="sm:col-span-2 lg:col-span-1">
                <ProductivityGauge data={data.productivity_score} />
              </div>
            </section>

            {/* Row 2: Study Heatmap */}
            <section className="rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
              <h2 className="mb-6 text-xl font-bold tracking-tight text-ink">
                {t('analytics.heatmapTitle')}
              </h2>
              <div className="overflow-x-auto pb-4">
                <StudyHeatmap data={data.heatmap} year={currentYear} />
              </div>
            </section>

            {/* Row 3: Time by Method (Pie) + Time by Course (Bar) */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Pie: Time by method */}
              <section className="rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-ink">
                  {t('analytics.byMethod')}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.time_by_method.map((m) => ({
                          name: t(`methods.${m.method}`),
                          value: m.total_minutes,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {data.time_by_method.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: colors.card,
                          border: `1px solid ${colors.grid}`,
                          borderRadius: 8,
                          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                          color: readVar('--ink', '#000000'),
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
                      />
                      <Legend wrapperStyle={{ color: readVar('--ink-secondary', '#31302e'), fontSize: 12, fontWeight: 500 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Horizontal Bar: Time by course */}
              <section className="rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-ink">
                  {t('analytics.byCourse')}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.time_by_course.slice(0, 8).map((c) => ({
                        name: c.subject.length > 16 ? c.subject.slice(0, 14) + '…' : c.subject,
                        minutes: c.total_minutes,
                      }))}
                      margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.grid}
                        horizontal={false}
                      />
                      <XAxis type="number" stroke={colors.text} tickLine={false} fontSize={12} fontWeight={500} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        stroke={readVar('--ink', '#000000')}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        fontWeight={600}
                      />
                      <Tooltip
                        cursor={{ fill: colors.grid, opacity: 0.3 }}
                        contentStyle={{
                          background: colors.card,
                          border: `1px solid ${colors.grid}`,
                          borderRadius: 8,
                          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                          color: readVar('--ink', '#000000'),
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
                      />
                      <Bar
                        dataKey="minutes"
                        fill={colors.accent}
                        radius={[0, 4, 4, 0]}
                        maxBarSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* Row 4: Focus Trend (Line) */}
            <section className="rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
              <h2 className="mb-6 text-xl font-bold tracking-tight text-ink">
                {t('analytics.focusTrend')}
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.focus_trend.map((f) => ({
                      date: f.date.slice(5), // MM-DD
                      focus: f.avg_focus,
                    }))}
                    margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="date" stroke={colors.text} tickLine={false} fontSize={12} fontWeight={500} axisLine={false} />
                    <YAxis
                      domain={[0, 10]}
                      stroke={colors.text}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      fontWeight={500}
                    />
                    <Tooltip
                      contentStyle={{
                        background: colors.card,
                        border: `1px solid ${colors.grid}`,
                        borderRadius: 8,
                        boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                        color: readVar('--ink', '#000000'),
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      formatter={(value: number) => [value.toFixed(1), t('analytics.avgFocus')]}
                    />
                    <Line
                      type="monotone"
                      dataKey="focus"
                      stroke={colors.accent}
                      strokeWidth={3}
                      dot={{ r: 4, fill: colors.card, stroke: colors.accent, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: colors.accent }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Row 5: Hourly Distribution + Method Effectiveness */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Hourly distribution bar chart */}
              <section className="rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-ink">
                  {t('analytics.hourlyTitle')}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        data.hourly_distribution.length > 0
                          ? data.hourly_distribution.map((h) => ({
                              hour: `${String(h.hour).padStart(2, '0')}:00`,
                              minutes: h.total_minutes,
                            }))
                          : []
                      }
                      margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                      <XAxis
                        dataKey="hour"
                        stroke={colors.text}
                        tickLine={false}
                        fontSize={11}
                        fontWeight={500}
                        interval={2}
                        axisLine={false}
                      />
                      <YAxis stroke={colors.text} tickLine={false} axisLine={false} fontSize={12} fontWeight={500} />
                      <Tooltip
                        cursor={{ fill: colors.grid, opacity: 0.3 }}
                        contentStyle={{
                          background: colors.card,
                          border: `1px solid ${colors.grid}`,
                          borderRadius: 8,
                          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                          color: readVar('--ink', '#000000'),
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
                      />
                      <Bar
                        dataKey="minutes"
                        fill="#1aae39" // sticker-green
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Method effectiveness table */}
              <section className="rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-ink">
                  {t('analytics.effectivenessTitle')}
                </h2>
                {data.method_effectiveness.length === 0 ? (
                  <p className="text-sm font-medium text-ink-muted">{t('analytics.noData')}</p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {data.method_effectiveness.map((me) => (
                      <div key={me.method} className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink text-base">
                            {t(`methods.${me.method}`)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                              {t('analytics.avgFocus')}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-canvas-soft border border-hairline overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${(me.avg_focus / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-ink">
                                {me.avg_focus.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                              {t('analytics.completionRate')}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-canvas-soft border border-hairline overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-sticker-green transition-all duration-500"
                                  style={{
                                    width: `${Math.min(me.avg_completion_rate * 100, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold text-ink">
                                {(me.avg_completion_rate * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
