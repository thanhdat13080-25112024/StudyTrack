/**
 * Analytics page — rich study-habit analytics with charts, heatmap, and
 * productivity score. All data is computed on-read from the backend;
 * this page only renders it.
 */
import { useMemo, useState } from 'react';
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
import { ComparisonCard } from '@/components/analytics/ComparisonCard';
import { ProductivityGauge } from '@/components/analytics/ProductivityGauge';
import { StudyHeatmap } from '@/components/analytics/StudyHeatmap';
import { useChartTheme } from '@/components/charts/chartTheme';
import { Card } from '@/components/ui/card';
import { useAnalytics } from '@/features/analytics/hooks';

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
  const [range, setRange] = useState<DateRange>('all');
  const params = useMemo(() => rangeToParams(range), [range]);
  const { data, isLoading } = useAnalytics(params.fromDate, params.toDate);

  const theme = useChartTheme();

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-main">{t('analytics.title')}</h1>

        {/* Date range selector */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-text-muted">{t('analytics.dateRange')}:</span>
          {(['all', '30', '90', 'year'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                range === r
                  ? 'bg-accent text-white'
                  : 'bg-bg-card text-text-muted hover:bg-accent/10'
              }`}
            >
              {t(`analytics.${r === 'all' ? 'allTime' : r === 'year' ? 'thisYear' : `last${r}`}`)}
            </button>
          ))}
        </div>
      </section>

      {isLoading || !data ? (
        <p className="text-text-muted">{t('common.loading')}</p>
      ) : data.time_by_method.length === 0 &&
        data.time_by_course.length === 0 &&
        data.focus_trend.length === 0 ? (
        <Card className="p-8 text-center text-text-muted">{t('analytics.noData')}</Card>
      ) : (
        <>
          {/* Row 1: Comparison cards (narrow column) + Productivity gauge (wide).
              The gauge carries a breakdown the comparison cards don't, so it gets
              2/3 of the row on desktop instead of an equal third. */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
            </div>
            <div className="lg:col-span-2">
              <ProductivityGauge data={data.productivity_score} />
            </div>
          </section>

          {/* Row 2: Study Heatmap */}
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-text-helper">
              {t('analytics.heatmapTitle')}
            </h2>
            <div className="overflow-x-auto">
              <StudyHeatmap data={data.heatmap} year={currentYear} />
            </div>
          </Card>

          {/* Row 3: Time by Method (Pie) + Time by Course (Bar) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Pie: Time by method */}
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-text-helper">
                {t('analytics.byMethod')}
              </h2>
              <div className="h-64">
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
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {data.time_by_method.map((_, i) => (
                        <Cell key={i} fill={theme.series[i % theme.series.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={theme.tooltipStyle}
                      formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
                    />
                    <Legend wrapperStyle={{ color: theme.text, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Horizontal Bar: Time by course */}
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-text-helper">
                {t('analytics.byCourse')}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.time_by_course.slice(0, 8).map((c) => ({
                      name: c.subject.length > 16 ? c.subject.slice(0, 14) + '…' : c.subject,
                      minutes: c.total_minutes,
                    }))}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                    <XAxis type="number" stroke={theme.text} tickLine={false} fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      stroke={theme.text}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <Tooltip
                      cursor={{ fill: theme.grid, opacity: 0.3 }}
                      contentStyle={theme.tooltipStyle}
                      formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
                    />
                    <Bar
                      dataKey="minutes"
                      fill={theme.accent}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 4: Focus Trend (Line) */}
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-text-helper">
              {t('analytics.focusTrend')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.focus_trend.map((f) => ({
                    date: f.date.slice(5), // MM-DD
                    focus: f.avg_focus,
                  }))}
                  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={theme.text} tickLine={false} fontSize={12} />
                  <YAxis
                    domain={[0, 10]}
                    stroke={theme.text}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={theme.tooltipStyle}
                    formatter={(value: number) => [value.toFixed(1), t('analytics.avgFocus')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="focus"
                    stroke={theme.accent}
                    strokeWidth={2}
                    dot={{ r: 3, fill: theme.accent }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Row 5: Hourly Distribution + Method Effectiveness */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Hourly distribution bar chart */}
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-text-helper">
                {t('analytics.hourlyTitle')}
              </h2>
              <div className="h-64">
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
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                    <XAxis
                      dataKey="hour"
                      stroke={theme.text}
                      tickLine={false}
                      fontSize={11}
                      interval={2}
                    />
                    <YAxis stroke={theme.text} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      cursor={{ fill: theme.grid, opacity: 0.3 }}
                      contentStyle={theme.tooltipStyle}
                      formatter={(value: number) => [`${value} ${t('common.minutesShort')}`, '']}
                    />
                    <Bar
                      dataKey="minutes"
                      fill={theme.series[1]}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Method effectiveness table */}
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-text-helper">
                {t('analytics.effectivenessTitle')}
              </h2>
              {data.method_effectiveness.length === 0 ? (
                <p className="text-sm text-text-muted">{t('analytics.noData')}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {data.method_effectiveness.map((me) => (
                    <div key={me.method} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-helper">
                          {t(`methods.${me.method}`)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-text-muted">{t('analytics.avgFocus')}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-border">
                              <div
                                className="h-full rounded-full bg-accent transition-all duration-500"
                                style={{ width: `${(me.avg_focus / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-text-helper">
                              {me.avg_focus.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-text-muted">
                            {t('analytics.completionRate')}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-border">
                              <div
                                className="h-full rounded-full bg-sticker-green transition-all duration-500"
                                style={{
                                  width: `${Math.min(me.avg_completion_rate * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-text-helper">
                              {(me.avg_completion_rate * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
