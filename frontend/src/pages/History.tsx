/**
 * History page — lists recorded study sessions (port of the legacy history
 * list). Each row shows subject, date, actual/planned minutes, focus, method,
 * note, and a delete action.
 */
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDeleteSession, useSessions } from '@/features/sessions/hooks';
import type { StudySession } from '@/features/sessions/types';
import { getMotion } from '@/lib/motion';

function SessionRow({ session }: { session: StudySession }) {
  const { t } = useTranslation();
  const del = useDeleteSession();
  return (
    <Card className="flex items-start justify-between gap-4 p-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-text-helper">{session.subject}</span>
          <span className="rounded-pill bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            {t(`methods.${session.method}`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
          <span>{session.session_date}</span>
          <span>
            {t('history.actualOfPlanned', {
              actual: session.actual_minutes,
              planned: session.planned_minutes,
            })}
          </span>
          <span>{t('history.focusValue', { focus: session.focus })}</span>
        </div>
        {session.note && <p className="text-sm text-text-muted">{session.note}</p>}
        {del.isError && <span className="text-sm text-red-400">{t('common.actionFailed')}</span>}
      </div>
      <Button
        variant="outline"
        size="icon"
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
  const m = getMotion(!!useReducedMotion());

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-text-main">{t('history.title')}</h1>
        {isLoading ? (
          <p className="text-text-muted">{t('common.loading')}</p>
        ) : !data || data.length === 0 ? (
          <Card className="p-8 text-center text-text-muted">{t('history.empty')}</Card>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            variants={m.list}
            initial="initial"
            animate="animate"
          >
            {data.map((s) => (
              <motion.div key={s.id} variants={m.item}>
                <SessionRow session={s} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
