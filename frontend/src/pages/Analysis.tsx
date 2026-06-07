/**
 * Analysis page — rule-based study/academic insights. Two sections:
 *  - Weak subjects: red/yellow flags (low grade, low study-time/credit, failed
 *    prerequisite) with the signals + metrics behind each flag.
 *  - Direction: strength ranking by course category, overloaded-semester
 *    warnings, and missing-prerequisite reports. All advice text is localized
 *    client-side from the structured backend signals.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useDirection, useWeakSubjects } from '@/features/analysis/hooks';
import { useCourses } from '@/features/courses/hooks';

export default function Analysis() {
  const { t } = useTranslation();
  const { data: weak, isLoading: weakLoading } = useWeakSubjects();
  const { data: direction, isLoading: dirLoading } = useDirection();
  const { data: courses } = useCourses();

  const codeById = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of courses ?? []) m.set(c.id, c.code);
    return m;
  }, [courses]);

  return (
    <main className="min-h-full bg-bg-main text-text-main">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <AppHeader />

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" aria-hidden />
            <h1 className="text-xl font-bold text-text-main">{t('analysis.weakTitle')}</h1>
          </div>
          {weakLoading ? (
            <p className="text-text-muted">{t('common.loading')}</p>
          ) : (weak ?? []).length === 0 ? (
            <p className="text-text-muted">{t('analysis.noWeak')}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(weak ?? []).map((w) => (
                <div
                  key={w.course_id}
                  className="flex flex-col gap-2 rounded-card border border-border bg-bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-text-helper">
                      {w.code} <span className="font-sans text-text-muted">{w.name}</span>
                    </span>
                    <span
                      className={
                        w.priority === 'red'
                          ? 'rounded-token bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400'
                          : 'rounded-token bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-500'
                      }
                    >
                      {t(`weakSubject.priority.${w.priority}`)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {w.signals.map((s) => (
                      <span
                        key={s}
                        className="rounded-token bg-menu-item px-2 py-0.5 text-xs text-text-helper"
                      >
                        {t(`weakSubject.signal.${s}`)}
                      </span>
                    ))}
                  </div>
                  {(w.metrics.grade_4 !== undefined ||
                    w.metrics.minutes_per_credit !== undefined) && (
                    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                      {w.metrics.grade_4 !== undefined && (
                        <span>
                          {t('weakSubject.metric.grade4')}: {w.metrics.grade_4}
                        </span>
                      )}
                      {w.metrics.minutes_per_credit !== undefined && (
                        <span>
                          {t('weakSubject.metric.minutesPerCredit')}: {w.metrics.minutes_per_credit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" aria-hidden />
            <h1 className="text-xl font-bold text-text-main">{t('analysis.directionTitle')}</h1>
          </div>
          {dirLoading ? (
            <p className="text-text-muted">{t('common.loading')}</p>
          ) : !direction || direction.category_strengths.length === 0 ? (
            <p className="text-text-muted">{t('analysis.noData')}</p>
          ) : (
            <div className="flex flex-col gap-6 rounded-card border border-border bg-bg-card p-6 shadow-card">
              {direction.strongest_category && (
                <p className="text-sm text-text-helper">
                  {t('analysis.strongest')}:{' '}
                  <span className="font-semibold text-accent">
                    {t(`courses.cat.${direction.strongest_category}`)}
                  </span>
                </p>
              )}
              <div className="flex flex-col gap-3">
                {direction.category_strengths.map((cs) => (
                  <div key={cs.category} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm text-text-helper">
                      <span>{t(`courses.cat.${cs.category}`)}</span>
                      <span className="text-text-muted">
                        {cs.avg_grade_4} · {cs.count}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-menu-item">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(cs.avg_grade_4 / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {direction.overloaded_semesters.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                    {t('analysis.overloaded')}
                  </h3>
                  <ul className="text-sm text-text-helper">
                    {direction.overloaded_semesters.map((o) => (
                      <li key={o.code}>
                        {o.code} — {o.total_credits} {t('roadmap.creditsShort')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {direction.missing_prerequisites.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-text-helper">
                    {t('analysis.missingPrereq')}
                  </h3>
                  <ul className="text-sm text-text-helper">
                    {direction.missing_prerequisites.map((mp) => (
                      <li key={mp.course_id}>
                        <span className="font-mono">{mp.code}</span> ←{' '}
                        {mp.missing.map((id) => codeById.get(id) ?? id).join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
