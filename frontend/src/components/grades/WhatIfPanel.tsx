/**
 * WhatIfPanel — two academic planners over `POST /api/gpa/what-if`:
 *  1. Goal-seek: given a target CPA + total required credits, the backend
 *     returns the average needed on the remaining credits, feasibility, and the
 *     max reachable CPA. The target can be saved back to the profile.
 *  2. Projection: hypothetical {credits, grade_10} rows → projected CPA + tier.
 * The backend is canonical; inputs prefill from the profile (`useMe`).
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe, useUpdateProfile } from '@/features/auth/hooks';
import { GPA_KEY, useWhatIf } from '@/features/grades/hooks';

interface HypRow {
  credits: string;
  grade_10: string;
}

export function WhatIfPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const profile = me?.profile;

  const [targetCpa, setTargetCpa] = useState('');
  const [totalCredits, setTotalCredits] = useState('');
  const [rows, setRows] = useState<HypRow[]>([{ credits: '', grade_10: '' }]);

  const goalSeek = useWhatIf();
  const projection = useWhatIf();
  const saveTarget = useUpdateProfile();

  // Prefill the goal-seek inputs from the saved profile once it loads.
  const initialized = useRef(false);
  useEffect(() => {
    if (profile && !initialized.current) {
      initialized.current = true;
      if (profile.target_cpa != null) setTargetCpa(String(profile.target_cpa));
      if (profile.total_credits_required != null)
        setTotalCredits(String(profile.total_credits_required));
    }
  }, [profile]);

  const handleGoalSeek = () => {
    if (targetCpa === '') return;
    goalSeek.mutate({
      target_cpa: Number(targetCpa),
      total_credits_required: totalCredits === '' ? null : Number(totalCredits),
      hypotheticals: [],
    });
  };

  const handleSaveTarget = () => {
    if (targetCpa === '') return;
    saveTarget.mutate(
      {
        target_cpa: Number(targetCpa),
        total_credits_required: totalCredits === '' ? null : Number(totalCredits),
      },
      { onSuccess: () => void qc.invalidateQueries({ queryKey: GPA_KEY }) },
    );
  };

  const handleProject = () => {
    const hypotheticals = rows
      .filter((r) => r.credits !== '' && r.grade_10 !== '')
      .map((r) => ({ credits: Number(r.credits), grade_10: Number(r.grade_10) }));
    projection.mutate({ hypotheticals });
  };

  const gs = goalSeek.data?.goal_seek;
  const proj = projection.data?.projection;

  const badge = gs
    ? gs.already_met
      ? { cls: 'bg-amber-500/15 text-amber-500', label: t('gpa.whatif.alreadyMet') }
      : gs.feasible
        ? { cls: 'bg-sticker-green/15 text-sticker-green', label: t('gpa.whatif.feasible') }
        : { cls: 'bg-red-500/15 text-red-400', label: t('gpa.whatif.infeasible') }
    : null;

  return (
    <Card className="flex flex-col gap-6 p-6">
      <h2 className="text-lg font-bold text-text-helper">{t('gpa.whatif.title')}</h2>

      {/* Goal-seek */}
      <div className="flex flex-col gap-4">
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wi-target">{t('gpa.whatif.targetCpa')}</Label>
            <Input
              id="wi-target"
              type="number"
              min={0}
              max={4}
              step={0.1}
              value={targetCpa}
              onChange={(e) => setTargetCpa(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wi-total">{t('gpa.whatif.totalCredits')}</Label>
            <Input
              id="wi-total"
              type="number"
              min={0}
              value={totalCredits}
              onChange={(e) => setTotalCredits(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleGoalSeek}>
              {t('gpa.whatif.compute')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveTarget}
              disabled={targetCpa === '' || saveTarget.isPending}
            >
              <Save className="h-4 w-4" aria-hidden />
              {saveTarget.isSuccess ? t('gpa.whatif.saved') : t('gpa.whatif.saveTarget')}
            </Button>
          </div>
        </div>

        {gs ? (
          <div className="grid gap-3 rounded-md bg-menu-item p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              {badge && (
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
              <span className="text-sm text-text-muted">
                {t('gpa.whatif.targetTier')}:{' '}
                <b className="text-text-helper">{t(`gpa.tier.${gs.target_tier}`)}</b>
              </span>
            </div>
            <p className="text-sm text-text-muted">
              {t('gpa.whatif.requiredAvg')}:{' '}
              <b className="text-text-main">{gs.required_avg != null ? gs.required_avg : '—'}</b>
            </p>
            <p className="text-sm text-text-muted">
              {t('gpa.whatif.remainingCredits')}:{' '}
              <b className="text-text-main">{gs.remaining_credits}</b>
            </p>
            <p className="text-sm text-text-muted">
              {t('gpa.whatif.maxReachable')}:{' '}
              <b className="text-text-main">{gs.max_reachable_cpa.toFixed(2)}</b>
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted">{t('gpa.whatif.noTarget')}</p>
        )}
      </div>

      {/* Projection */}
      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <span className="text-sm font-semibold text-text-helper">
          {t('gpa.whatif.projectionTitle')}
        </span>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`hyp-cr-${i}`} className="text-xs text-text-muted">
                  {t('gpa.whatif.hypCredits')}
                </Label>
                <Input
                  id={`hyp-cr-${i}`}
                  type="number"
                  min={0}
                  max={30}
                  className="w-24"
                  value={row.credits}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, credits: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`hyp-gr-${i}`} className="text-xs text-text-muted">
                  {t('gpa.whatif.hypGrade')}
                </Label>
                <Input
                  id={`hyp-gr-${i}`}
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-28"
                  value={row.grade_10}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, grade_10: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t('gpa.whatif.removeRow')}
                disabled={rows.length === 1}
                onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, { credits: '', grade_10: '' }])}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('gpa.whatif.addRow')}
          </Button>
          <Button type="button" size="sm" onClick={handleProject}>
            {t('gpa.whatif.compute')}
          </Button>
          {proj && (
            <span className="text-sm text-text-muted">
              {t('gpa.whatif.projectedCpa')}:{' '}
              <b className="text-text-main">{proj.projected_cpa.toFixed(2)}</b> ·{' '}
              <span className="text-text-helper">{t(`gpa.tier.${proj.projected_tier}`)}</span>
            </span>
          )}
        </div>
      </div>

      {(goalSeek.isError || projection.isError || saveTarget.isError) && (
        <span className="text-sm text-red-400">{t('common.actionFailed')}</span>
      )}
    </Card>
  );
}
