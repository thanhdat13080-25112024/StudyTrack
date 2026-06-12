/**
 * SemesterManager — a lightweight modal (no Dialog dep in the kit) to add /
 * edit / delete academic semesters. Deleting a semester cascades its grades, so
 * the semester hooks also invalidate the grades list + GPA summary.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  useCreateSemester,
  useDeleteSemester,
  useSemesters,
  useUpdateSemester,
} from '@/features/semesters/hooks';
import type { Semester } from '@/features/semesters/types';

interface FormValues {
  code: string;
  name: string;
}

const EMPTY: FormValues = { code: '', name: '' };

interface SemesterManagerProps {
  onClose: () => void;
}

export function SemesterManager({ onClose }: SemesterManagerProps) {
  const { t } = useTranslation();
  const { data: semesters, isLoading } = useSemesters();
  const create = useCreateSemester();
  const update = useUpdateSemester();
  const remove = useDeleteSemester();

  const [form, setForm] = useState<FormValues>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modal is mounted only while open, so the trap is always active here; it
  // locks scroll, traps Tab, and returns focus to the trigger on unmount.
  useFocusTrap(containerRef, true);

  // Esc closes the modal (the palette/help overlays do the same).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.code.trim()) return;
    const payload = { code: form.code.trim(), name: form.name.trim() || null };
    if (editingId !== null) {
      update.mutate({ id: editingId, data: payload }, { onSuccess: reset });
    } else {
      create.mutate(payload, { onSuccess: () => setForm(EMPTY) });
    }
  };

  const handleEdit = (s: Semester) => {
    setEditingId(s.id);
    setForm({ code: s.code, name: s.name ?? '' });
  };

  const handleDelete = (s: Semester) => {
    if (window.confirm(t('grades.sem.deleteConfirm'))) remove.mutate(s.id);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <Card
        elevated
        className="flex w-full max-w-md flex-col gap-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-helper">{t('grades.sem.addTitle')}</h2>
          <Button variant="ghost" size="sm" aria-label={t('grades.sem.close')} onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sem-code">{t('grades.sem.code')}</Label>
              <Input
                id="sem-code"
                placeholder={t('grades.sem.codeHint')}
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sem-name">{t('grades.sem.name')}</Label>
              <Input
                id="sem-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={create.isPending || update.isPending}>
              {editingId !== null ? t('grades.sem.save') : t('grades.sem.add')}
            </Button>
            {editingId !== null && (
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                {t('grades.sem.cancel')}
              </Button>
            )}
          </div>
        </form>

        {(create.isError || update.isError || remove.isError) && (
          <span className="text-sm text-red-400">{t('common.actionFailed')}</span>
        )}

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <p className="text-sm text-text-muted">{t('common.loading')}</p>
          ) : (semesters ?? []).length === 0 ? (
            <p className="text-sm text-text-muted">{t('grades.sem.empty')}</p>
          ) : (
            (semesters ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm text-text-main">
                  <span className="font-mono font-semibold text-text-helper">{s.code}</span>
                  {s.name ? ` · ${s.name}` : ''}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('grades.sem.edit')}
                    onClick={() => handleEdit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('grades.sem.delete')}
                    disabled={remove.isPending}
                    onClick={() => handleDelete(s)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
