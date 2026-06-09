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
    <main className="min-h-full bg-canvas-soft text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <AppHeader />

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-ink">{t('analysis.weakTitle')}</h1>
          </div>
          {weakLoading ? (
            <p className="text-ink-muted">{t('common.loading')}</p>
          ) : (weak ?? []).length === 0 ? (
            <Card className="p-12 text-center text-ink-muted border-dashed border-hairline shadow-none bg-canvas-soft/50 font-medium">
              {t('analysis.noWeak')}
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(weak ?? []).map((w) => (
                <div
                  key={w.course_id}
                  className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-5 shadow-sm hover:shadow-level-1 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-bold text-primary">{w.code}</span>
                      <span className="font-bold text-ink leading-tight">{w.name}</span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                        w.priority === 'red'
                          ? 'bg-red-50 text-red-500 border-red-100'
                          : 'bg-sticker-orange/10 text-sticker-orange border-sticker-orange/20'
                      )}
                    >
                      {t(`weakSubject.priority.${w.priority}`)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {w.signals.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-canvas-soft px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-muted border border-hairline"
                      >
                        {t(`weakSubject.signal.${s}`)}
                      </span>
                    ))}
                  </div>
                  {(w.metrics.grade_4 !== undefined ||
                    w.metrics.minutes_per_credit !== undefined) && (
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium pt-1">
                      {w.metrics.grade_4 !== undefined && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-ink-faint font-bold tracking-widest text-[9px] uppercase">{t('weakSubject.metric.grade4')}</span>
                          <span className="text-ink font-bold">{w.metrics.grade_4}</span>
                        </span>
                      )}
                      {w.metrics.minutes_per_credit !== undefined && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-ink-faint font-bold tracking-widest text-[9px] uppercase">{t('weakSubject.metric.minutesPerCredit')}</span>
                          <span className="text-ink font-bold">{w.metrics.minutes_per_credit}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-ink">{t('analysis.directionTitle')}</h1>
          </div>
          {dirLoading ? (
            <p className="text-ink-muted">{t('common.loading')}</p>
          ) : !direction || direction.category_strengths.length === 0 ? (
            <Card className="p-12 text-center text-ink-muted border-dashed border-hairline shadow-none bg-canvas-soft/50 font-medium">
              {t('analysis.noData')}
            </Card>
          ) : (
            <div className="flex flex-col gap-8 rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
              {direction.strongest_category && (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    {t('analysis.strongest')}
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {t(`courses.cat.${direction.strongest_category}`)}
                  </p>
                </div>
              )}
              
              <div className="grid gap-6 sm:grid-cols-2">
                {direction.category_strengths.map((cs) => (
                  <div key={cs.category} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t(`courses.cat.${cs.category}`)}</span>
                      <span className="text-sm font-bold text-ink">
                        {cs.avg_grade_4.toFixed(2)} <span className="text-ink-faint font-medium ml-1">({cs.count})</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas-soft border border-hairline">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${(cs.avg_grade_4 / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-hairline">
                {direction.overloaded_semesters.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-sticker-orange">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      {t('analysis.overloaded')}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {direction.overloaded_semesters.map((o) => (
                        <li key={o.code} className="flex items-center justify-between rounded-md bg-sticker-orange/5 border border-sticker-orange/10 px-3 py-2 text-sm">
                          <span className="font-mono font-bold text-sticker-orange">{o.code}</span>
                          <span className="font-bold text-ink-secondary">{o.total_credits} {t('roadmap.creditsShort')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {direction.missing_prerequisites.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-ink">
                      {t('analysis.missingPrereq')}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {direction.missing_prerequisites.map((mp) => (
                        <li key={mp.course_id} className="flex flex-col gap-1 rounded-md bg-canvas-soft/50 border border-hairline px-3 py-2 text-sm">
                          <span className="font-mono font-bold text-primary">{mp.code}</span>
                          <span className="text-xs text-ink-muted leading-relaxed">
                            {t('analysis.missing')}: {mp.missing.map((id) => codeById.get(id) ?? id).join(', ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
