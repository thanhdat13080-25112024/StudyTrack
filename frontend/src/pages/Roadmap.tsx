/**
 * Roadmap page — generate a suggested course plan (topo-sorted by prerequisites,
 * packed under a per-semester credit cap) and optionally apply it (persists
 * planned_semester_id + creates the future semesters). Generate is stateless;
 * Apply writes through the roadmap hooks (which invalidate courses/grades/gpa).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Play, Route } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
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
    <main className="min-h-full bg-canvas-soft text-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <AppHeader />

        <section className="flex flex-col gap-6 rounded-lg border border-hairline bg-surface p-8 shadow-level-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Route className="h-6 w-6 text-primary" aria-hidden />
              <h1 className="text-3xl font-bold tracking-tight text-ink">{t('roadmap.title')}</h1>
            </div>
            <p className="text-sm font-medium text-ink-muted leading-relaxed">{t('roadmap.subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-end gap-5 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cap" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                {t('roadmap.capLabel')}
              </Label>
              <Input
                id="cap"
                type="number"
                min={1}
                max={50}
                className="w-32 bg-surface border-hairline h-10"
                placeholder={String(profileCap)}
                value={cap}
                onChange={(e) => setCap(e.target.value)}
              />
            </div>
            <Button onClick={onGenerate} disabled={generate.isPending} className="rounded-full px-8 font-bold h-10">
              <Play className="h-4 w-4" aria-hidden />
              {t('roadmap.generate')}
            </Button>
            <Button variant="outline" onClick={onApply} disabled={!plan || apply.isPending} className="rounded-full px-8 font-bold h-10 border-hairline shadow-sm">
              <Check className="h-4 w-4" aria-hidden />
              {t('roadmap.apply')}
            </Button>
            {applied && <span className="text-sm font-bold text-primary animate-in fade-in slide-in-from-left-2">{t('roadmap.applied')}</span>}
          </div>
          {(generate.isError || apply.isError) && (
            <span className="text-sm font-bold text-red-500">{t('common.actionFailed')}</span>
          )}
        </section>

        {plan && plan.warnings.length > 0 && (
          <section className="rounded-md border border-sticker-orange/40 bg-sticker-orange/5 p-5">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sticker-orange">{t('roadmap.warningsTitle')}</h2>
            <ul className="flex flex-col gap-1.5 text-sm font-medium text-ink-secondary">
              {plan.warnings.map((w, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-sticker-orange mt-0.5">•</span>
                  {warningText(w, t)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan && plan.semesters.length === 0 ? (
          <Card className="p-16 text-center text-ink-muted border-dashed border-hairline shadow-none bg-canvas-soft/50">
            {t('roadmap.empty')}
          </Card>
        ) : plan ? (
          <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-hairline">
            {plan.semesters.map((sem) => (
              <div
                key={sem.code}
                className="flex min-w-[260px] flex-col gap-4 rounded-lg border border-hairline bg-canvas/30 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                  <span className="font-mono font-bold text-primary text-base">{sem.code}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    {sem.total_credits} {t('roadmap.creditsShort')}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {sem.courses.map((c) => (
                    <div
                      key={c.course_id}
                      className="flex items-center justify-between rounded-md border border-hairline bg-surface px-3 py-2.5 shadow-sm hover:shadow-level-1 transition-all"
                    >
                      <span className="font-mono text-sm font-bold text-ink">
                        {c.code}
                        {!c.is_required && (
                          <span className="ml-2 rounded-full bg-hairline px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-muted">
                            {t('courses.electiveShort')}
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-bold text-primary">{c.credits}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-16 text-center text-ink-muted border-dashed border-hairline shadow-none bg-canvas-soft/50">
            <p className="font-medium">{t('roadmap.hint')}</p>
          </Card>
        )}
      </div>
    </main>
  );
}
