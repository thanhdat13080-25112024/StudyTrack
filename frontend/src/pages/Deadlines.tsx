/** Deadlines page — list (sorted by due date, overdue/soon highlighted) + a
 * create form. Reminder offset uses presets. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { getMotion } from '@/lib/motion';

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
  // Status accent on the left edge: green = done, red = overdue (past due, not
  // done), yellow = still pending.
  const rowTone = (d: Deadline) => {
    if (d.done) return 'border-l-4 border-sticker-green';
    const diff = new Date(d.due_at).getTime() - now;
    if (diff < 0) return 'border-l-4 border-red-500';
    return 'border-l-4 border-amber-500';
  };

  const m = getMotion(!!useReducedMotion());

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-main">{t('deadlines.title')}</h1>

      <Card className="grid gap-3 p-4 md:grid-cols-2">
        <input
          className="rounded-md border border-border bg-input-bg px-3 py-2 text-text-main"
          placeholder={t('deadlines.titlePlaceholder')}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="datetime-local"
          className="rounded-md border border-border bg-input-bg px-3 py-2 text-text-main"
          value={form.dueLocal}
          onChange={(e) => setForm({ ...form, dueLocal: e.target.value })}
        />
        <select
          className="rounded-md border border-border bg-input-bg px-3 py-2 text-text-main"
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
          className="rounded-md border border-border bg-input-bg px-3 py-2 text-text-main"
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
          className="rounded-md border border-border bg-input-bg px-3 py-2 text-text-main"
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
          className="rounded-md border border-border bg-input-bg px-3 py-2 text-text-main"
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
          <Button onClick={submit} disabled={createMut.isPending}>
            {t('deadlines.add')}
          </Button>
        </div>
      </Card>

      <motion.section
        className="flex flex-col gap-2"
        variants={m.list}
        initial="initial"
        animate="animate"
      >
        {(deadlines ?? []).length === 0 && (
          <p className="text-text-muted">{t('deadlines.empty')}</p>
        )}
        {(deadlines ?? []).map((d) => (
          <motion.div
            key={d.id}
            variants={m.item}
            className={`flex items-center justify-between gap-3 rounded-md border border-border bg-bg-card p-3 ${rowTone(d)}`}
          >
            <div className="flex flex-col">
              <span className="font-medium text-text-main">{d.title}</span>
              <span className="text-sm text-text-muted">
                {t(`deadlines.types.${d.type}`)} · {new Date(d.due_at).toLocaleString()}
                {d.course ? ` · ${d.course.code}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateMut.mutate({ id: d.id, data: { done: !d.done } })}
              >
                {d.done ? t('deadlines.markUndone') : t('deadlines.markDone')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => deleteMut.mutate(d.id)}>
                {t('common.delete')}
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}
