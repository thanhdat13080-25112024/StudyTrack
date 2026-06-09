/**
 * History page — lists recorded study sessions (port of the legacy history
 * list). Each row shows subject, date, actual/planned minutes, focus, method,
 * note, and a delete action.
 */
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDeleteSession, useSessions } from '@/features/sessions/hooks';
import type { StudySession } from '@/features/sessions/types';

function SessionRow({ session }: { session: StudySession }) {
  const { t } = useTranslation();
  const del = useDeleteSession();
  return (
    <Card className="flex items-start justify-between gap-4 p-5 border-hairline shadow-sm hover:shadow-level-1 transition-all">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-ink">{session.subject}</span>
          <span className="rounded-full bg-canvas-soft border border-hairline px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t(`methods.${session.method}`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span className="font-medium">{session.session_date}</span>
          <span>
            {t('history.actualOfPlanned', {
              actual: session.actual_minutes,
              planned: session.planned_minutes,
            })}
          </span>
          <span className="font-medium text-primary">{t('history.focusValue', { focus: session.focus })}/10</span>
        </div>
        {session.note && <p className="text-sm italic text-ink-muted mt-0.5">"{session.note}"</p>}
        {del.isError && <span className="text-sm font-bold text-red-500">{t('common.actionFailed')}</span>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-ink-faint hover:text-red-500 hover:bg-red-50"
        aria-label={t('history.delete')}
        disabled={del.isPending}
        onClick={() => del.mutate(session.id)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </Card>
  );
}

export default function History() {
  const { t } = useTranslation();
  const { data, isLoading } = useSessions();

  return (
    <main className="min-h-full bg-canvas-soft text-ink">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8">
        <AppHeader />
        <section className="flex flex-col gap-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t('history.title')}</h1>
          {isLoading ? (
            <p className="text-ink-muted">{t('common.loading')}</p>
          ) : !data || data.length === 0 ? (
            <Card className="p-12 text-center text-ink-muted border-dashed border-hairline shadow-none bg-canvas-soft/50">
              {t('history.empty')}
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
