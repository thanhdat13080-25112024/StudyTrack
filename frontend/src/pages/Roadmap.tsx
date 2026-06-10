/**
 * Roadmap page — generate a suggested course plan (topo-sorted by prerequisites,
 * packed under a per-semester credit cap) and optionally apply it (persists
 * planned_semester_id + creates the future semesters). Generate is stateless;
 * Apply writes through the roadmap hooks (which invalidate courses/grades/gpa).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Play, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe } from '@/features/auth/hooks';
import { useApplyRoadmap, useGenerateRoadmap } from '@/features/roadmap/hooks';
import type { RoadmapPlan, RoadmapWarning } from '@/features/roadmap/types';

function warningText(w: RoadmapWarning, t: (k: string, o?: Record<string, unknown>) => string) {
  if (w.type === 'cycle')
    return t('roadmap.warning.cycle', { ids: (w.course_ids ?? []).join(', ') });
  if (w.type === 'exceeds_graduation')
    return t('roadmap.warning.exceeds_graduation', { code: w.detail });
  return w.type;
}

export default function Roadmap() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  const generate = useGenerateRoadmap();
  const apply = useApplyRoadmap();

  const [cap, setCap] = useState('');
  const [plan, setPlan] = useState<RoadmapPlan | null>(null);
  const [applied, setApplied] = useState(false);

  const profileCap = me?.profile.max_credits_per_semester ?? 24;
  const body = () => ({ max_credits_per_semester: cap ? Number(cap) : null });

  const onGenerate = () => {
    setApplied(false);
    generate.mutate(body(), { onSuccess: setPlan });
  };
  const onApply = () =>
    apply.mutate(body(), {
      onSuccess: (p) => {
        setPlan(p);
        setApplied(true);
      },
    });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-accent" aria-hidden />
          <h1 className="text-xl font-bold text-text-main">{t('roadmap.title')}</h1>
        </div>
        <p className="text-sm text-text-muted">{t('roadmap.subtitle')}</p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cap">{t('roadmap.capLabel')}</Label>
            <Input
              id="cap"
              type="number"
              min={1}
              max={50}
              className="w-32"
              placeholder={String(profileCap)}
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </div>
          <Button onClick={onGenerate} disabled={generate.isPending}>
            <Play className="h-4 w-4" aria-hidden />
            {t('roadmap.generate')}
          </Button>
          <Button variant="outline" onClick={onApply} disabled={!plan || apply.isPending}>
            <Check className="h-4 w-4" aria-hidden />
            {t('roadmap.apply')}
          </Button>
          {applied && <span className="text-sm text-accent">{t('roadmap.applied')}</span>}
        </div>
        {(generate.isError || apply.isError) && (
          <span className="text-sm text-red-400">{t('common.actionFailed')}</span>
        )}
      </section>

      {plan && plan.warnings.length > 0 && (
        <section className="rounded-card border border-amber-500/40 bg-amber-500/10 p-4">
          <h2 className="mb-2 text-sm font-bold text-amber-500">{t('roadmap.warningsTitle')}</h2>
          <ul className="flex flex-col gap-1 text-sm text-text-helper">
            {plan.warnings.map((w, i) => (
              <li key={i}>{warningText(w, t)}</li>
            ))}
          </ul>
        </section>
      )}

      {plan && plan.semesters.length === 0 ? (
        <p className="text-text-muted">{t('roadmap.empty')}</p>
      ) : plan ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {plan.semesters.map((sem) => (
            <div
              key={sem.code}
              className="flex min-w-[220px] flex-col gap-3 rounded-card border border-border bg-bg-card p-4 shadow-card"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono font-bold text-text-helper">{sem.code}</span>
                <span className="text-xs text-text-muted">
                  {sem.total_credits} {t('roadmap.creditsShort')}
                </span>
              </div>
              {sem.courses.map((c) => (
                <div
                  key={c.course_id}
                  className="flex items-center justify-between rounded-token bg-menu-item px-3 py-2"
                >
                  <span className="font-mono text-sm font-semibold text-text-main">
                    {c.code}
                    {!c.is_required && (
                      <span className="ml-1.5 text-[10px] text-text-muted">
                        {t('courses.electiveShort')}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-text-muted">{c.credits}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-muted">{t('roadmap.hint')}</p>
      )}
    </div>
  );
}
