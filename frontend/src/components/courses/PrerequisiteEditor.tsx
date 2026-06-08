/**
 * Prerequisite editor — per course, lists its prerequisites as removable chips
 * and offers a Select of the user's other courses to add one. Backed by the
 * /api/prerequisites CRUD hooks. Presentational + controlled-props style.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreatePrerequisite,
  useDeletePrerequisite,
  usePrerequisites,
} from '@/features/prerequisites/hooks';
import type { Course } from '@/features/courses/types';

export function PrerequisiteEditor({ courses }: { courses: Course[] }) {
  const { t } = useTranslation();
  const { data: prereqs } = usePrerequisites();
  const create = useCreatePrerequisite();
  const remove = useDeletePrerequisite();
  const [draft, setDraft] = useState<Record<number, string>>({});

  if (courses.length === 0) return null;
  const all = prereqs ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-text-helper">{t('courses.prereq.title')}</h2>
      <div className="divide-y divide-border/60 rounded-card border border-border bg-bg-card shadow-card">
        {courses.map((c) => {
          const mine = all.filter((p) => p.course_id === c.id);
          const options = courses.filter(
            (o) => o.id !== c.id && !mine.some((p) => p.prereq_course_id === o.id),
          );
          const sel = draft[c.id] ?? '';
          return (
            <div
              key={c.id}
              className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:gap-4"
            >
              <div className="min-w-[180px] font-mono text-sm font-semibold text-text-helper">
                {c.code} <span className="font-sans font-normal text-text-muted">{c.name}</span>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {mine.length === 0 && (
                  <span className="text-sm text-text-muted">{t('courses.prereq.none')}</span>
                )}
                {mine.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 rounded-token bg-menu-item px-2 py-1 text-xs text-text-helper"
                  >
                    {p.prereq_code}
                    <button
                      type="button"
                      aria-label={t('courses.prereq.remove')}
                      onClick={() => remove.mutate(p.id)}
                      className="text-text-muted hover:text-red-400"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
              {options.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={sel} onValueChange={(v) => setDraft((d) => ({ ...d, [c.id]: v }))}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder={t('courses.prereq.add')} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!sel || create.isPending}
                    onClick={() => {
                      if (sel)
                        create.mutate(
                          { course_id: c.id, prereq_course_id: Number(sel) },
                          { onSuccess: () => setDraft((d) => ({ ...d, [c.id]: '' })) },
                        );
                    }}
                  >
                    {t('courses.prereq.addBtn')}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
