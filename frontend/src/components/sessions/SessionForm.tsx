/**
 * SessionForm — the focus-session setup form (subject, duration, focus slider,
 * method select, note). Controlled via props; the Focus page owns the state,
 * the live suggestion box, and the start action.
 */
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STUDY_METHODS, type StudyMethod } from '@/features/sessions/types';

export interface SessionFormValues {
  subject: string;
  minutes: number;
  focus: number;
  method: StudyMethod;
  note: string;
  courseId: number | null;
}

export interface SessionCourseOption {
  id: number;
  code: string;
  name: string;
}

interface SessionFormProps {
  values: SessionFormValues;
  onChange: (patch: Partial<SessionFormValues>) => void;
  onStart: () => void;
  error?: string | null;
  suggestion?: string | null;
  courses?: SessionCourseOption[];
}

const NO_COURSE = 'none';

export function SessionForm({
  values,
  onChange,
  onStart,
  error,
  suggestion,
  courses = [],
}: SessionFormProps) {
  const { t } = useTranslation();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onStart();
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {t('focus.subjectLabel')}
          </Label>
          <Input
            id="subject"
            value={values.subject}
            placeholder={t('focus.subjectPlaceholder')}
            onChange={(e) => onChange({ subject: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="minutes" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {t('focus.durationLabel')}
          </Label>
          <Input
            id="minutes"
            type="number"
            min={1}
            value={values.minutes || ''}
            onChange={(e) => onChange({ minutes: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="focus" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
          {t('focus.focusLabel')} — <span className="font-bold text-primary">{values.focus}/10</span>
        </Label>
        <Slider
          id="focus"
          min={1}
          max={10}
          step={1}
          value={[values.focus]}
          onValueChange={(v) => onChange({ focus: v[0] })}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="method" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {t('focus.methodLabel')}
          </Label>
          <Select
            value={values.method}
            onValueChange={(v) => onChange({ method: v as StudyMethod })}
          >
            <SelectTrigger id="method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STUDY_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`methods.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="note" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {t('focus.noteLabel')}
          </Label>
          <Textarea
            id="note"
            rows={1}
            value={values.note}
            onChange={(e) => onChange({ note: e.target.value })}
          />
        </div>
      </div>

      {courses.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="course" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {t('focus.courseLabel')}
          </Label>
          <Select
            value={values.courseId === null ? NO_COURSE : String(values.courseId)}
            onValueChange={(v) => {
              if (v === NO_COURSE) {
                onChange({ courseId: null });
                return;
              }
              const id = Number(v);
              const picked = courses.find((c) => c.id === id);
              onChange({
                courseId: id,
                ...(picked && !values.subject.trim() ? { subject: picked.name } : {}),
              });
            }}
          >
            <SelectTrigger id="course">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_COURSE}>{t('focus.noCourse')}</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {suggestion && (
        <div className="flex gap-2 rounded-md border border-sticker-teal bg-sticker-teal/5 p-4 text-sm text-ink-secondary">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sticker-teal" aria-hidden />
          <p>{suggestion}</p>
        </div>
      )}

      {error && <p className="text-sm font-bold text-red-500">{error}</p>}

      <Button type="submit" size="lg" className="self-start rounded-full px-8 font-bold">
        {t('focus.start')}
      </Button>
    </form>
  );
}
