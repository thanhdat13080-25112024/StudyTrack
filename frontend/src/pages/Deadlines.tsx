/** Deadlines page — list (sorted by due date, overdue/soon highlighted) + a
 * create form. Reminder offset uses presets. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/features/courses/hooks';
import {
  useCreateDeadline,
  useDeadlines,
  useDeleteDeadline,
  useUpdateDeadline,
} from '@/features/deadlines/hooks';
import {
  DEADLINE_PRIORITIES,
  DEADLINE_TYPES,
  REMIND_PRESETS,
  type Deadline,
} from '@/features/deadlines/types';

const EMPTY = {
  title: '',
  type: 'assignment' as (typeof DEADLINE_TYPES)[number],
  dueLocal: '',
  priority: 'medium' as (typeof DEADLINE_PRIORITIES)[number],
  remindKey: 'd1',
  courseId: '' as string,
};

export default function Deadlines() {
  const { t } = useTranslation();
  const { data: deadlines } = useDeadlines();
  const { data: courses } = useCourses();
  const createMut = useCreateDeadline();
  const updateMut = useUpdateDeadline();
  const deleteMut = useDeleteDeadline();
  const [form, setForm] = useState(EMPTY);

  const submit = () => {
    if (!form.title || !form.dueLocal) return;
    const minutes = REMIND_PRESETS.find((p) => p.key === form.remindKey)?.minutes ?? null;
    createMut.mutate(
      {
        title: form.title,
        type: form.type,
        due_at: new Date(form.dueLocal).toISOString(),
        priority: form.priority,
        remind_before_minutes: minutes,
        course_id: form.courseId ? Number(form.courseId) : null,
      },
      { onSuccess: () => setForm(EMPTY) },
    );
  };

  const now = Date.now();
  const rowTone = (d: Deadline) => {
    if (d.done) return 'opacity-50 grayscale';
    const diff = new Date(d.due_at).getTime() - now;
    if (diff < 0) return 'border-l-4 border-red-500 shadow-level-1';
    if (diff < 24 * 3600 * 1000) return 'border-l-4 border-sticker-orange shadow-level-1';
    return 'border-l-4 border-hairline shadow-sm';
  };

  return (
    <main className="min-h-full bg-canvas-soft text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <AppHeader />
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t('deadlines.title')}</h1>

        <section className="grid gap-4 rounded-lg border border-hairline bg-surface p-8 shadow-level-1 md:grid-cols-2">
          <input
            className="rounded-xs border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-all"
            placeholder={t('deadlines.titlePlaceholder')}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="datetime-local"
            className="rounded-xs border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-all"
            value={form.dueLocal}
            onChange={(e) => setForm({ ...form, dueLocal: e.target.value })}
          />
          <select
            className="rounded-xs border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-all"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
          >
            {DEADLINE_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`deadlines.types.${ty}`)}
              </option>
            ))}
          </select>
          <select
            className="rounded-xs border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-all"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}
          >
            {DEADLINE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`deadlines.priorities.${p}`)}
              </option>
            ))}
          </select>
          <select
            className="rounded-xs border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-all"
            value={form.remindKey}
            onChange={(e) => setForm({ ...form, remindKey: e.target.value })}
          >
            {REMIND_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {t(`deadlines.remind.${p.key}`)}
              </option>
            ))}
          </select>
          <select
            className="rounded-xs border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-all"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          >
            <option value="">{t('deadlines.noCourse')}</option>
            {(courses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <div className="md:col-span-2">
            <Button onClick={submit} disabled={createMut.isPending} className="rounded-full px-8 font-bold">
              {t('deadlines.add')}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          {(deadlines ?? []).length === 0 && (
            <Card className="p-12 text-center text-ink-muted border-dashed border-hairline shadow-none bg-canvas-soft/50">
              {t('deadlines.empty')}
            </Card>
          )}
          {(deadlines ?? []).map((d) => (
            <div
              key={d.id}
              className={cn(
                'flex items-center justify-between gap-4 rounded-md border bg-surface p-4 transition-all',
                rowTone(d),
              )}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-ink leading-tight">{d.title}</span>
                <span className="text-xs font-medium text-ink-muted">
                  <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider mr-2 border border-hairline">
                    {t(`deadlines.types.${d.type}`)}
                  </span>
                  {new Date(d.due_at).toLocaleString()}
                  {d.course ? <span className="text-primary font-bold"> · {d.course.code}</span> : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'rounded-full px-4 font-bold h-8 border border-hairline',
                    d.done ? 'bg-canvas-soft text-ink-muted' : 'bg-surface text-primary hover:bg-primary/5',
                  )}
                  onClick={() => updateMut.mutate({ id: d.id, data: { done: !d.done } })}
                >
                  {d.done ? t('deadlines.markUndone') : t('deadlines.markDone')}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-ink-faint hover:text-red-500" onClick={() => deleteMut.mutate(d.id)}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
