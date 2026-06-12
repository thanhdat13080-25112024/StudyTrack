/**
 * AvatarMenu — Facebook-style avatar actions for the student-ID card: click
 * the avatar -> small menu ("view avatar" -> lightbox / "choose avatar" ->
 * file picker). Mounted only while open (SemesterManager modal pattern);
 * Esc/click-outside closes; the lightbox focus-traps like other overlays.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface AvatarMenuProps {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  onPick: (file: File) => void;
}

export function AvatarMenu({ open, onClose, avatarUrl, onPick }: AvatarMenuProps) {
  const { t } = useTranslation();
  const [viewing, setViewing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Lightbox is mounted only while viewing: trap focus + lock scroll there.
  useFocusTrap(lightboxRef, viewing);

  const closeAll = () => {
    setViewing(false);
    onClose();
  };

  useEffect(() => {
    if (!open && !viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // closeAll is stable enough for this effect (state setters + onClose prop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viewing]);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
          onClose();
        }}
      />
      {open && !viewing && (
        <>
          {/* click-outside catcher under the popover */}
          <div className="fixed inset-0 z-20" onClick={onClose} aria-hidden />
          <div
            role="menu"
            className="absolute left-6 top-24 z-30 w-56 rounded-md border border-border bg-bg-card p-1 shadow-elevated"
          >
            <button
              role="menuitem"
              disabled={!avatarUrl}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-text-main hover:bg-menu-item disabled:opacity-40"
              onClick={() => setViewing(true)}
            >
              {t('studentId.avatarView')}
            </button>
            <button
              role="menuitem"
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-text-main hover:bg-menu-item"
              onClick={() => fileRef.current?.click()}
            >
              {t('studentId.avatarChange')}
            </button>
          </div>
        </>
      )}
      {viewing && avatarUrl && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('studentId.avatarView')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={closeAll}
        >
          <img
            src={avatarUrl}
            alt={t('studentId.avatarView')}
            className="max-h-[80vh] max-w-[90vw] rounded-card object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 text-white hover:bg-white/10"
            aria-label={t('grades.sem.close')}
            onClick={closeAll}
          >
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      )}
    </>
  );
}
