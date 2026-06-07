/**
 * ScheduleForm — add/edit a weekly schedule item (day select, time input,
 * subject). Controlled by the Schedule page; doubles as the edit form when an
 * existing item is loaded (the page passes its values + an "editing" flag).
 */
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAY_KEYS } from '@/features/schedule/types';

export interface ScheduleFormValues {
  day_of_week: number;
  time: string;
  subject: string;
}

interface ScheduleFormProps {
  values: ScheduleFormValues;
  editing: boolean;
  onChange: (patch: Partial<ScheduleFormValues>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ScheduleForm({ values, editing, onChange, onSubmit, onCancel }: ScheduleFormProps) {
  const { t } = useTranslation();

  return (
    <form
      className="grid gap-4 md:grid-cols-[1fr_auto_2fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sched-day">{t('schedule.dayLabel')}</Label>
        <Select
          value={String(values.day_of_week)}
          onValueChange={(v) => onChange({ day_of_week: Number(v) })}
        >
          <SelectTrigger id="sched-day">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_KEYS.map((key, index) => (
              <SelectItem key={key} value={String(index)}>
                {t(`days.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sched-time">{t('schedule.timeLabel')}</Label>
        <Input
          id="sched-time"
          type="time"
          value={values.time}
          onChange={(e) => onChange({ time: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sched-subject">{t('schedule.subjectLabel')}</Label>
        <Input
          id="sched-subject"
          value={values.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{editing ? t('schedule.save') : t('schedule.add')}</Button>
        {editing && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('schedule.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
