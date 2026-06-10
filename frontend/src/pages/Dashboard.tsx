/**
 * Dashboard — greeting + streak, KPI cards, 7-day chart, achievement badges,
 * and a recent-history preview. All derived data comes from `GET /api/dashboard`
 * (computed by the tested backend services); this page only renders it.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Flame, GraduationCap, Layers, Timer as TimerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';
import { BadgeGrid } from '@/components/dashboard/BadgeGrid';
import { useDashboard } from '@/features/sessions/hooks';
import { useGpa } from '@/features/grades/hooks';
import { useAuthStore } from '@/store/authStore';

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-token bg-accent/15 text-accent">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-text-helper">{value}</span>
        <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboard();
  const { data: gpa } = useGpa();
  const name = useAuthStore((s) => s.user?.user.name ?? '');

  const streak = data?.kpis.streak ?? 0;
  const hasGrades = !!gpa && (gpa.semesters.length > 0 || gpa.cpa > 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-main">{t('dashboard.greeting', { name })}</h1>
        <p className="flex items-center gap-1.5 text-text-muted">
          <Flame className="h-4 w-4 text-brand-gold" aria-hidden />
          {streak > 0 ? t('dashboard.streak', { count: streak }) : t('dashboard.streak_zero')}
        </p>
      </section>

      {isLoading || !data ? (
        <p className="text-text-muted">{t('dashboard.loading')}</p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<Clock className="h-5 w-5" aria-hidden />}
              label={t('dashboard.kpiToday')}
              value={`${data.kpis.today_minutes} ${t('common.minutesShort')}`}
            />
            <KpiCard
              icon={<TimerIcon className="h-5 w-5" aria-hidden />}
              label={t('dashboard.kpiTotalHours')}
              value={`${(data.kpis.total_minutes / 60).toFixed(1)} ${t('common.hours')}`}
            />
            <KpiCard
              icon={<Layers className="h-5 w-5" aria-hidden />}
              label={t('dashboard.kpiTotalSessions')}
              value={String(data.kpis.total_sessions)}
            />
            <KpiCard
              icon={<Flame className="h-5 w-5" aria-hidden />}
              label={t('dashboard.kpiStreak')}
              value={String(data.kpis.streak)}
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/focus">
                <TimerIcon className="h-4 w-4" aria-hidden />
                {t('dashboard.startFocus')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/schedule">{t('dashboard.openSchedule')}</Link>
            </Button>
          </div>

          {gpa && (
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-token bg-brand-emerald/15 text-brand-emerald">
                  <GraduationCap className="h-5 w-5" aria-hidden />
                </div>
                {hasGrades ? (
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-text-helper">
                      {gpa.cpa.toFixed(2)}
                      <span className="ml-2 text-sm font-medium text-text-muted">
                        {t(`gpa.tier.${gpa.classification}`)}
                      </span>
                    </span>
                    <span className="text-xs uppercase tracking-wide text-text-muted">
                      {t('gpa.cpa')}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-text-muted">{t('gpa.cardEmpty')}</span>
                )}
              </div>
              <Link
                to="/grades"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent"
              >
                {t('gpa.cardViewGrades')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Card>
          )}

          <section className="rounded-card border border-border bg-bg-card p-6 shadow-card">
            <h2 className="mb-4 text-base font-semibold text-text-helper">
              {t('dashboard.chartTitle')}
            </h2>
            <WeeklyChart data={data.chart} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-text-main">{t('badges.title')}</h2>
            <BadgeGrid badges={data.badges} />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-main">
                {t('dashboard.recentTitle')}
              </h2>
              <Link
                to="/history"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent"
              >
                {t('dashboard.viewAllHistory')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            {data.recent_sessions.length === 0 ? (
              <Card className="p-6 text-center text-text-muted">{t('dashboard.recentEmpty')}</Card>
            ) : (
              <div className="flex flex-col gap-2">
                {data.recent_sessions.map((s) => (
                  <Card key={s.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-helper">{s.subject}</span>
                      <span className="text-xs text-text-muted">
                        {s.session_date} · {t(`methods.${s.method}`)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-muted">
                      {s.actual_minutes} {t('common.minutesShort')}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
