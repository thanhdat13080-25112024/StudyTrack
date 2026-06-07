/**
 * Schedule page — weekly study calendar (port of legacy `renderCalendar` +
 * `handleSaveSchedule`). 7-column grid (Mon→Sun); each column lists that day's
 * items sorted by time, with edit + delete. The add/edit form writes via the
 * schedule CRUD hooks.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScheduleForm, type ScheduleFormValues } from '@/components/schedule/ScheduleForm';
import {
  useCreateScheduleItem,
  useDeleteScheduleItem,
  useSchedule,
  useUpdateScheduleItem,
} from '@/features/schedule/hooks';
import { DAY_KEYS, type ScheduleItem } from '@/features/schedule/types';

const EMPTY_FORM: ScheduleFormValues = { day_of_week: 0, time: '08:00', subject: '' };

export default function Schedule() {
  const { t } = useTranslation();
  const { data, isLoading } = useSchedule();
  const create = useCreateScheduleItem();
  const update = useUpdateScheduleItem();
  const remove = useDeleteScheduleItem();

  const [form, setForm] = useState<ScheduleFormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const byDay = useMemo(() => {
    const map: Record<number, ScheduleItem[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    (data ?? []).forEach((item) => {
      map[item.day_of_week]?.push(item);
    });
    Object.values(map).forEach((items) => items.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [data]);

  const handleChange = (patch: Partial<ScheduleFormValues>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.subject.trim()) return;
    if (editingId !== null) {
      update.mutate({ id: editingId, data: form }, { onSuccess: resetForm });
    } else {
      create.mutate({ ...form, recurring: true }, { onSuccess: () => setForm(EMPTY_FORM) });
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setForm({ day_of_week: item.day_of_week, time: item.time, subject: item.subject });
  };

  return (
    <main className="min-h-full bg-bg-main text-text-main">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <AppHeader />

        <section className="rounded-card border border-border bg-bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-text-helper">{t('schedule.addTitle')}</h2>
          <ScheduleForm
            values={form}
            editing={editingId !== null}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-bold text-text-main">{t('schedule.title')}</h1>
          {isLoading ? (
            <p className="text-text-muted">{t('common.loading')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {DAY_KEYS.map((key, index) => (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-card border border-border bg-bg-card p-3"
                >
                  <div className="border-b border-border pb-2 text-center text-sm font-semibold text-accent">
                    {t(`days.${key}`)}
                  </div>
                  {byDay[index].length === 0 ? (
                    <p className="py-4 text-center text-xs text-text-muted">
                      {t('schedule.noItems')}
                    </p>
                  ) : (
                    byDay[index].map((item) => (
                      <Card key={item.id} className="flex flex-col gap-1 p-3">
                        <span className="font-mono text-sm font-semibold text-text-helper">
                          {item.time}
                        </span>
                        <span className="text-sm text-text-muted">{item.subject}</span>
                        <div className="mt-1 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('schedule.edit')}
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('schedule.delete')}
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
