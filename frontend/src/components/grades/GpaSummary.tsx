/**
 * GpaSummary — the academic-results panel: cumulative CPA (big), localized
 * classification, credit-progress bars (earned / in-progress vs required), and a
 * per-semester GPA list. Reads the backend `GET /api/gpa` summary (source of
 * truth); the backend already applies retake latest-wins + credit rules.
 */
import { useTranslation } from 'react-i18next';
import type { GpaSummary as GpaSummaryData } from '@/features/grades/types';

interface GpaSummaryProps {
  data: GpaSummaryData;
}

const TIER_COLOR: Record<string, string> = {
  xuat_sac: 'text-sticker-pink',
  gioi: 'text-primary',
  kha: 'text-primary',
  trung_binh: 'text-sticker-orange',
  yeu: 'text-red-500',
};

export function GpaSummary({ data }: GpaSummaryProps) {
  const { t } = useTranslation();
  const { cpa, classification, credits, semesters } = data;
  const { earned, in_progress, remaining, required } = credits;

  const denom = required > 0 ? required : Math.max(earned + in_progress, 1);
  const pct = (n: number) => `${Math.min(100, Math.round((n / denom) * 100))}%`;

  return (
    <Card className="flex flex-col gap-8 p-8 border-hairline shadow-level-1">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1">{t('gpa.cpa')}</p>
          <p className="text-6xl font-bold leading-none tracking-tighter text-ink">{cpa.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1">{t('gpa.classification')}</p>
          <p className={cn('text-3xl font-bold tracking-tight', TIER_COLOR[classification] ?? 'text-ink')}>
            {t(`gpa.tier.${classification}`)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-ink">{t('gpa.creditsTitle')}</span>
          {required > 0 && (
            <span className="font-bold text-ink-muted">
              {earned} <span className="text-ink-faint font-medium">/ {required}</span>
            </span>
          )}
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-canvas-soft border border-hairline">
          <div className="h-full bg-sticker-green shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" style={{ width: pct(earned) }} aria-hidden />
          <div className="h-full bg-primary/40" style={{ width: pct(in_progress) }} aria-hidden />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sticker-green" />{' '}
            {t('gpa.earned')}: <b className="font-bold text-ink">{earned}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/40" />{' '}
            {t('gpa.inProgress')}: <b className="font-bold text-ink">{in_progress}</b>
          </span>
          {required > 0 && (
            <span>
              {t('gpa.remaining')}: <b className="font-bold text-ink">{remaining}</b>
            </span>
          )}
        </div>
      </div>

      {semesters.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{t('gpa.perSemester')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {semesters.map((s) => (
              <div
                key={s.semester_id}
                className="flex items-center justify-between rounded-md border border-hairline bg-canvas-soft/30 px-3 py-2 text-sm"
              >
                <span className="font-mono font-bold text-ink-secondary">{s.code}</span>
                <span className="text-ink-muted">
                  <span className="text-[10px] uppercase font-bold tracking-wider mr-1">GPA</span>
                  <b className="font-bold text-primary">{s.gpa.toFixed(2)}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
