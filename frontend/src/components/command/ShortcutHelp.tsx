/**
 * ShortcutHelp — the `?` overlay listing every keyboard binding (Phase C).
 *
 * Plain modal matching `SemesterManager` chrome (`bg-black/50` backdrop,
 * `role="dialog"` `aria-modal`, `<Card elevated>`, Esc via useEffect). The body
 * iterates `SHORTCUT_ROWS` grouped (navigation / actions); each row is a quiet
 * `<kbd>` chip cluster + a localized description. The go-to row expands into the
 * per-page legend (`g` then ⟨letter⟩) reusing the existing `nav.*` labels.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { GOTO, SHORTCUT_ROWS, type ShortcutRow } from '@/lib/shortcuts';

export interface ShortcutHelpProps {
  open: boolean;
  onClose: () => void;
}

/** A quiet hairline key chip (`bg-bg-main` fill, `rounded-xs`). */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-xs border border-border bg-bg-main px-1.5 py-0.5 font-mono text-xs text-text-helper">
      {children}
    </kbd>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-eyebrow text-text-faint">
      {children}
    </p>
  );
}

export function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Trap focus + lock body scroll while open; restore focus to the trigger on close.
  useFocusTrap(containerRef, open);

  if (!open) return null;

  const rowsByGroup = (group: ShortcutRow['group']) =>
    SHORTCUT_ROWS.filter((r) => r.group === group);

  const renderRow = (row: ShortcutRow) => (
    <div
      key={row.descKey}
      className="flex flex-col gap-1.5 py-1.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="text-[15px] text-text-main">{t(row.descKey)}</span>
      {row.goto ? (
        <span className="flex items-center gap-1 text-text-faint">
          <Kbd>g</Kbd>
          <span className="text-xs">{t('shortcuts.then')}</span>
          <Kbd>{'⟨'}…{'⟩'}</Kbd>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          {row.keys.map((k, i) => (
            <Kbd key={i}>{k}</Kbd>
          ))}
        </span>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('shortcuts.title')}
      onClick={onClose}
    >
      <Card
        elevated
        className="flex w-full max-w-md flex-col gap-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-helper">{t('shortcuts.title')}</h2>
          <Button variant="ghost" size="sm" aria-label={t('shortcuts.close')} onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <GroupHeading>{t('shortcuts.group.navigation')}</GroupHeading>
          <div className="flex flex-col divide-y divide-border">
            {rowsByGroup('navigation').map(renderRow)}
          </div>
          {/* Per-page go-to legend (reuses the nav.* labels). */}
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-sm bg-bg-main p-3">
            {GOTO.map((row) => (
              <span key={row.to} className="flex items-center gap-2 text-sm text-text-helper">
                <Kbd>{row.letter}</Kbd>
                <span className="truncate">{t(row.navKey)}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <GroupHeading>{t('shortcuts.group.actions')}</GroupHeading>
          <div className="flex flex-col divide-y divide-border">
            {rowsByGroup('actions').map(renderRow)}
          </div>
        </div>
      </Card>
    </div>
  );
}
