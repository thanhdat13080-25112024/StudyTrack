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
import { BadgePill } from '@/components/ui/badge-pill';
import { StickerIcon } from '@/components/ui/sticker-icon';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';
import { BadgeGrid } from '@/components/dashboard/BadgeGrid';
import { useDashboard } from '@/features/sessions/hooks';
import { useGpa } from '@/features/grades/hooks';
import { useAuthStore } from '@/store/authStore';
import { Reveal } from '@/components/motion/Reveal';

function KpiCard({
  icon,
  color,
  label,
  value,
  decimals = 0,
  suffix = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <StickerIcon icon={icon} color={color} />
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-heading text-text-main">
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </span>
        <span className="text-xs uppercase tracking-eyebrow text-text-muted">{label}</span>
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
              icon={Clock}
              color="#62aef0"
              label={t('dashboard.kpiToday')}
              value={data.kpis.today_minutes}
              suffix={` ${t('common.minutesShort')}`}
            />
            <KpiCard
              icon={TimerIcon}
              color="#2a9d99"
              label={t('dashboard.kpiTotalHours')}
              value={data.kpis.total_minutes / 60}
              decimals={1}
              suffix={` ${t('common.hours')}`}
            />
            <KpiCard
              icon={Layers}
              color="#d6b6f6"
              label={t('dashboard.kpiTotalSessions')}
              value={data.kpis.total_sessions}
            />
            <KpiCard
              icon={Flame}
              color="#dd5b00"
              label={t('dashboard.kpiStreak')}
              value={data.kpis.streak}
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
                <StickerIcon icon={GraduationCap} color="#1aae39" />
                {hasGrades ? (
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-heading text-text-main">
                      <AnimatedNumber value={gpa.cpa} decimals={2} />
                      <span className="ml-2 text-sm font-medium text-text-muted">
                        {t(`gpa.tier.${gpa.classification}`)}
                      </span>
                    </span>
                    <span className="text-xs uppercase tracking-eyebrow text-text-muted">
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

          <Card className="p-6">
            <BadgePill className="mb-3">{t('dashboard.chartTitle')}</BadgePill>
            <WeeklyChart data={data.chart} />
          </Card>

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
              <Reveal className="flex flex-col gap-2">
                {data.recent_sessions.map((s) => (
                  <div key={s.id}>
                    <Card className="flex items-center justify-between gap-4 p-4">
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
                  </div>
                ))}
              </Reveal>
            )}
          </section>
        </>
      )}
    </div>
  );
}
