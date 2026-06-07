/**
 * Courses page — manage the user's curriculum (CTĐT). Add/edit/delete courses
 * (code, name, credits, category, required) via the course CRUD hooks. A grade
 * lives against a course, so deleting a course cascades its grades (the hooks
 * invalidate the GPA summary too).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourse,
} from '@/features/courses/hooks';
import { COURSE_CATEGORIES, type Course, type CourseCategory } from '@/features/courses/types';

const NONE = 'none';

interface FormValues {
  code: string;
  name: string;
  credits: number;
  category: CourseCategory | typeof NONE;
  is_required: boolean;
}

const EMPTY_FORM: FormValues = {
  code: '',
  name: '',
  credits: 3,
  category: NONE,
  is_required: true,
};

export default function Courses() {
  const { t } = useTranslation();
  const { data: courses, isLoading } = useCourses();
  const create = useCreateCourse();
  const update = useUpdateCourse();
  const remove = useDeleteCourse();

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const change = (patch: Partial<FormValues>) => setForm((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      credits: form.credits,
      category: form.category === NONE ? null : form.category,
      is_required: form.is_required,
      planned_semester_id: null,
    };
    if (editingId !== null) {
      update.mutate({ id: editingId, data: payload }, { onSuccess: reset });
    } else {
      create.mutate(payload, { onSuccess: () => setForm(EMPTY_FORM) });
    }
  };

  const handleEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      name: c.name,
      credits: c.credits,
      category: (c.category as CourseCategory | null) ?? NONE,
      is_required: c.is_required ?? true,
    });
  };

  const handleDelete = (c: Course) => {
    if (window.confirm(t('courses.deleteConfirm'))) remove.mutate(c.id);
  };

  return (
    <main className="min-h-full bg-bg-main text-text-main">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <AppHeader />

        <section className="rounded-card border border-border bg-bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-text-helper">{t('courses.addTitle')}</h2>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">{t('courses.code')}</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => change({ code: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">{t('courses.name')}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => change({ name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="credits">{t('courses.credits')}</Label>
                <Input
                  id="credits"
                  type="number"
                  min={0}
                  max={30}
                  value={form.credits}
                  onChange={(e) => change({ credits: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">{t('courses.category')}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => change({ category: v as FormValues['category'] })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('courses.categoryNone')}</SelectItem>
                    {COURSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`courses.cat.${cat}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex w-fit items-center gap-2 text-sm text-text-helper">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-accent"
                checked={form.is_required}
                onChange={(e) => change({ is_required: e.target.checked })}
              />
              {t('courses.required')}
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {editingId !== null ? t('courses.save') : t('courses.add')}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={reset}>
                  {t('courses.cancel')}
                </Button>
              )}
            </div>
          </form>
          {(create.isError || update.isError || remove.isError) && (
            <span className="mt-3 block text-sm text-red-400">{t('common.actionFailed')}</span>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-bold text-text-main">{t('courses.title')}</h1>
          {isLoading ? (
            <p className="text-text-muted">{t('common.loading')}</p>
          ) : (courses ?? []).length === 0 ? (
            <p className="text-text-muted">{t('courses.empty')}</p>
          ) : (
            <div className="overflow-x-auto rounded-card border border-border bg-bg-card shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="px-4 py-3 font-semibold">{t('courses.colCode')}</th>
                    <th className="px-4 py-3 font-semibold">{t('courses.colName')}</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      {t('courses.colCredits')}
                    </th>
                    <th className="px-4 py-3 font-semibold">{t('courses.colCategory')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {(courses ?? []).map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-mono font-semibold text-text-helper">
                        {c.code}
                        {!c.is_required && (
                          <span className="ml-2 rounded-token bg-menu-item px-1.5 py-0.5 text-[10px] text-text-muted">
                            {t('courses.electiveShort')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-main">{c.name}</td>
                      <td className="px-4 py-3 text-center text-text-muted">{c.credits}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {c.category ? t(`courses.cat.${c.category}`) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('courses.edit')}
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('courses.delete')}
                            disabled={remove.isPending}
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
