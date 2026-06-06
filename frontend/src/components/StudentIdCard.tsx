import { useTranslation } from 'react-i18next';

interface StudentIdCardProps {
  name: string;
  className: string;
  major: string;
  avatarUrl: string | null;
}

/** Port of the legacy `.student-id-card`. Gradient + text use theme tokens. */
export function StudentIdCard({ name, className, major, avatarUrl }: StudentIdCardProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-60 flex-col justify-between rounded-card border border-white/15 bg-id-card p-6 text-id-card-text">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tracking-widest">STUDENT CARD</span>
        <span className="h-6 w-9 rounded-md bg-yellow-300/80" aria-hidden />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/20 text-3xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>👨‍💻</span>
          )}
        </div>
        <div className="min-w-0">
          {/* Uppercase in JS so textContent matches (CSS uppercase is visual-only). */}
          <div className="truncate text-lg font-semibold">{(name || 'STUDENT NAME').toUpperCase()}</div>
          <div className="text-sm opacity-90">
            {t('studentId.class')}: {className || '...'}
          </div>
          <div className="text-sm opacity-90">
            {t('studentId.major')}: {major || '...'}
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs opacity-80">
        <span>SYSTEM: STUDYTRACK</span>
        <span>STATUS: ACTIVE</span>
      </div>
    </div>
  );
}
