/**
 * Grades page — record grades per course/semester and read the GPA/CPA summary.
 * The grade-entry form shows a live letter / 4.0 preview computed client-side via
 * `lib/gpa.ts` (the backend stays the source of truth on submit). A semester
 * selector filters the grades table and drives `useGrades`.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Settings2, Trash2 } from 'lucide-react';
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
import { GpaSummary } from '@/components/grades/GpaSummary';
import { SemesterManager } from '@/components/grades/SemesterManager';
import { useCourses } from '@/features/courses/hooks';
import { useSemesters } from '@/features/semesters/hooks';
import {
  useCreateGrade,
  useDeleteGrade,
  useGpa,
  useGrades,
  useUpdateGrade,
} from '@/features/grades/hooks';
import { GRADE_STATUSES, type Grade, type GradeStatus } from '@/features/grades/types';
import { gradeToGrade4, gradeToLetter } from '@/lib/gpa';

const ALL = 'all';

interface GradeFormValues {
  course_id: string;
  semester_id: string;
  grade_10: string;
  status: GradeStatus;
}

const EMPTY_FORM: GradeFormValues = {
  course_id: '',
  semester_id: '',
  grade_10: '',
  status: 'passed',
};

const STATUS_BADGE: Record<GradeStatus, string> = {
  passed: 'bg-brand-emerald/15 text-brand-emerald',
  failed: 'bg-red-500/15 text-red-400',
  in_progress: 'bg-accent/15 text-accent',
  exempt: 'bg-menu-item text-text-muted',
};

function needsGrade(status: GradeStatus): boolean {
  return status === 'passed' || status === 'failed';
}

export default function Grades() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>(ALL);
  const [managerOpen, setManagerOpen] = useState(false);
  const [form, setForm] = useState<GradeFormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selectedSemesterId = selected === ALL ? undefined : Number(selected);

  const { data: courses } = useCourses();
  const { data: semesters } = useSemesters();
  const { data: grades, isLoading } = useGrades(selectedSemesterId);
  const { data: gpa } = useGpa();
  const create = useCreateGrade();
  const update = useUpdateGrade();
  const remove = useDeleteGrade();

  const courseById = useMemo(
    () => new Map((courses ?? []).map((c) => [c.id, c])),
    [courses],
  );

  const change = (patch: Partial<GradeFormValues>) => setForm((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setForm({ ...EMPTY_FORM, semester_id: selectedSemesterId ? String(selectedSemesterId) : '' });
    setEditingId(null);
  };

  const preview =
    needsGrade(form.status) && form.grade_10 !== '' && Number(form.grade_10) >= 0
      ? {
          letter: gradeToLetter(Number(form.grade_10)),
          grade4: gradeToGrade4(Number(form.grade_10)).toFixed(1),
        }
      : null;

  const handleSubmit = () => {
    const graded = needsGrade(form.status);
    if (!form.course_id || !form.semester_id) return;
    if (graded && form.grade_10 === '') return;
    const payload = {
      course_id: Number(form.course_id),
      semester_id: Number(form.semester_id),
      grade_10: graded ? Number(form.grade_10) : null,
      status: form.status,
    };
    if (editingId !== null) {
      update.mutate({ id: editingId, data: payload }, { onSuccess: reset });
    } else {
      create.mutate(payload, { onSuccess: reset });
    }
  };

  const handleEdit = (g: Grade) => {
    setEditingId(g.id);
    setForm({
      course_id: String(g.course_id),
      semester_id: String(g.semester_id),
      grade_10: g.grade_10 != null ? String(g.grade_10) : '',
      status: g.status as GradeStatus,
    });
  };

  const handleDelete = (g: Grade) => {
    if (window.confirm(t('grades.deleteConfirm'))) remove.mutate(g.id);
  };

  const handleStatusChange = (status: GradeStatus) =>
    change({ status, grade_10: needsGrade(status) ? form.grade_10 : '' });

  const noCourses = (courses ?? []).length === 0;
  const noSemesters = (semesters ?? []).length === 0;

  return (
    <main className="min-h-full bg-bg-main text-text-main">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <AppHeader />

        <section className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-text-main">{t('grades.title')}</h1>
          <div className="flex items-center gap-2">
            <Label htmlFor="sem-filter" className="text-text-muted">
              {t('grades.semesterLabel')}
            </Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger id="sem-filter" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('grades.allSemesters')}</SelectItem>
                {(semesters ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code}
                    {s.name ? ` · ${s.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setManagerOpen(true)}>
              <Settings2 className="h-4 w-4" aria-hidden />
              {t('grades.manageSemesters')}
            </Button>
          </div>
        </section>

        {gpa && (gpa.semesters.length > 0 || gpa.credits.required > 0) ? (
          <GpaSummary data={gpa} />
        ) : (
          <p className="rounded-card border border-border bg-bg-card p-6 text-text-muted shadow-card">
            {t('gpa.noData')}
          </p>
        )}

        <section className="rounded-card border border-border bg-bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-text-helper">{t('grades.addGradeTitle')}</h2>
          {noSemesters ? (
            <p className="text-text-muted">{t('grades.noSemesters')}</p>
          ) : noCourses ? (
            <p className="text-text-muted">{t('grades.noCourses')}</p>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="g-course">{t('grades.courseLabel')}</Label>
                  <Select
                    value={form.course_id}
                    onValueChange={(v) => change({ course_id: v })}
                  >
                    <SelectTrigger id="g-course">
                      <SelectValue placeholder={t('grades.selectCourse')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(courses ?? []).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.code} · {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="g-sem">{t('grades.semesterLabel')}</Label>
                  <Select
                    value={form.semester_id}
                    onValueChange={(v) => change({ semester_id: v })}
                  >
                    <SelectTrigger id="g-sem">
                      <SelectValue placeholder={t('grades.selectSemester')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(semesters ?? []).map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.code}
                          {s.name ? ` · ${s.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="g-status">{t('grades.statusLabel')}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => handleStatusChange(v as GradeStatus)}
                  >
                    <SelectTrigger id="g-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`grades.status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="g-grade">{t('grades.gradeLabel')}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="g-grade"
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      disabled={!needsGrade(form.status)}
                      value={form.grade_10}
                      onChange={(e) => change({ grade_10: e.target.value })}
                    />
                    {preview && (
                      <span className="whitespace-nowrap text-sm text-text-muted">
                        {t('grades.preview')}:{' '}
                        <b className="text-text-helper">{preview.letter}</b> ({preview.grade4})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={create.isPending || update.isPending}>
                  {editingId !== null ? t('grades.save') : t('grades.add')}
                </Button>
                {editingId !== null && (
                  <Button type="button" variant="outline" onClick={reset}>
                    {t('grades.cancel')}
                  </Button>
                )}
              </div>
            </form>
          )}
          {(create.isError || update.isError || remove.isError) && (
            <span className="mt-3 block text-sm text-red-400">{t('common.actionFailed')}</span>
          )}
        </section>

        <section className="flex flex-col gap-4">
          {isLoading ? (
            <p className="text-text-muted">{t('common.loading')}</p>
          ) : (grades ?? []).length === 0 ? (
            <p className="text-text-muted">{t('grades.empty')}</p>
          ) : (
            <div className="overflow-x-auto rounded-card border border-border bg-bg-card shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="px-4 py-3 font-semibold">{t('grades.colCourse')}</th>
                    <th className="px-4 py-3 font-semibold">{t('grades.colSemester')}</th>
                    <th className="px-4 py-3 text-center font-semibold">{t('grades.colGrade')}</th>
                    <th className="px-4 py-3 text-center font-semibold">{t('grades.colLetter')}</th>
                    <th className="px-4 py-3 text-center font-semibold">{t('grades.colGrade4')}</th>
                    <th className="px-4 py-3 font-semibold">{t('grades.colStatus')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {(grades ?? []).map((g) => {
                    const course = courseById.get(g.course_id) ?? g.course;
                    return (
                      <tr key={g.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-text-helper">
                            {course.code}
                          </span>
                          <span className="ml-2 text-text-muted">{course.name}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-text-muted">{g.semester.code}</td>
                        <td className="px-4 py-3 text-center text-text-main">
                          {g.grade_10 != null ? g.grade_10 : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-text-helper">
                          {g.letter ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-text-muted">
                          {g.grade_4 != null ? g.grade_4.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-token px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[g.status as GradeStatus]}`}
                          >
                            {t(`grades.status.${g.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={t('grades.edit')}
                              onClick={() => handleEdit(g)}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={t('grades.delete')}
                              disabled={remove.isPending}
                              onClick={() => handleDelete(g)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {managerOpen && <SemesterManager onClose={() => setManagerOpen(false)} />}
    </main>
  );
}
