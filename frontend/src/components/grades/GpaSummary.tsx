/**
 * GpaSummary — the academic-results panel: cumulative CPA (big), localized
 * classification, credit-progress bars (earned / in-progress vs required), and a
 * per-semester GPA list. Reads the backend `GET /api/gpa` summary (source of
 * truth); the backend already applies retake latest-wins + credit rules.
 */
import { useTranslation } from 'react-i18next';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card } from '@/components/ui/card';
import type { GpaSummary as GpaSummaryData } from '@/features/grades/types';

interface GpaSummaryProps {
  data: GpaSummaryData;
}

const TIER_COLOR: Record<string, string> = {
  xuat_sac: 'text-sticker-green',
  gioi: 'text-accent',
  kha: 'text-accent',
  trung_binh: 'text-amber-500',
  yeu: 'text-red-400',
};

export function GpaSummary({ data }: GpaSummaryProps) {
  const { t } = useTranslation();
  const { cpa, classification, credits, semesters } = data;
  const { earned, in_progress, remaining, required } = credits;

  const denom = required > 0 ? required : Math.max(earned + in_progress, 1);
  const pct = (n: number) => `${Math.min(100, Math.round((n / denom) * 100))}%`;

  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">{t('gpa.cpa')}</p>
          <p className="text-5xl font-extrabold leading-none text-text-main">
            <AnimatedNumber value={cpa} decimals={2} />
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-muted">{t('gpa.classification')}</p>
          <p className={`text-2xl font-bold ${TIER_COLOR[classification] ?? 'text-text-main'}`}>
            {t(`gpa.tier.${classification}`)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-text-helper">{t('gpa.creditsTitle')}</span>
          {required > 0 && (
            <span className="text-text-muted">
              {earned} / {required}
            </span>
          )}
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-md bg-menu-item">
          <div className="h-full bg-sticker-green" style={{ width: pct(earned) }} aria-hidden />
          <div className="h-full bg-accent/60" style={{ width: pct(in_progress) }} aria-hidden />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-sticker-green" />{' '}
            {t('gpa.earned')}: <b className="text-text-helper">{earned}</b>
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-accent/60" />{' '}
            {t('gpa.inProgress')}: <b className="text-text-helper">{in_progress}</b>
          </span>
          {required > 0 && (
            <span>
              {t('gpa.remaining')}: <b className="text-text-helper">{remaining}</b>
            </span>
          )}
        </div>
      </div>

      {semesters.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-helper">{t('gpa.perSemester')}</span>
          <div className="flex flex-col gap-1">
            {semesters.map((s) => (
              <div
                key={s.semester_id}
                className="flex items-center justify-between rounded-md bg-menu-item px-3 py-1.5 text-sm"
              >
                <span className="font-mono text-text-helper">{s.code}</span>
                <span className="text-text-muted">
                  {t('gpa.cpa')}:{' '}
                  <b className="text-text-main">
                    <AnimatedNumber value={s.gpa} decimals={2} />
                  </b>{' '}
                  · {s.credits} {t('courses.credits')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
