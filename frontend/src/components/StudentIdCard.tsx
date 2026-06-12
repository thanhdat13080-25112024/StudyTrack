import { useTranslation } from 'react-i18next';
import { asCardTheme, cardThemes } from '@/lib/cardThemes';

interface StudentIdCardProps {
  name: string;
  className: string;
  major: string;
  avatarUrl: string | null;
  theme?: string | null;
  studentCode?: string | null;
  /** Avatar click (opens the Facebook-style menu). Omit -> static avatar. */
  onAvatarClick?: () => void;
}

/** Virtual student-ID card, 4 themes (lib/cardThemes). Theme-invariant across light/dark. */
export function StudentIdCard({
  name,
  className,
  major,
  avatarUrl,
  theme,
  studentCode,
  onAvatarClick,
}: StudentIdCardProps) {
  const { t } = useTranslation();
  const key = asCardTheme(theme);
  const cfg = cardThemes[key];

  const avatarInner = avatarUrl ? (
    <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
  ) : (
    <span aria-hidden>👨‍💻</span>
  );

  return (
    <div
      className={`relative flex h-60 flex-col justify-between overflow-hidden rounded-card p-6 ${cfg.text}`}
      style={cfg.card}
      data-card-theme={key}
    >
      {cfg.watermark && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1] opacity-[.13]"
          style={{
            right: cfg.watermark.right,
            bottom: cfg.watermark.bottom,
            width: cfg.watermark.size,
            height: cfg.watermark.size,
          }}
        >
          <img
            src={cfg.watermark.src}
            alt=""
            className="h-full w-full object-contain"
            style={{
              filter: cfg.watermark.white ? 'brightness(0) invert(1)' : undefined,
              transform: cfg.watermark.zoom
                ? `translate(8%,8%) scale(${cfg.watermark.zoom})`
                : undefined,
            }}
          />
        </div>
      )}
      {key === 'studytrack' && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-14 z-[1] h-40 w-40 rounded-full border-[1.5px] border-white/20"
        />
      )}
      {key === 'vju-mono' && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute left-[62%] top-3 z-[1] text-[11px] opacity-20"
          >
            🌸
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-12 z-[1] text-[9px] opacity-[.14]"
          >
            🌸
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute left-[72%] top-20 z-[1] text-[13px] opacity-[.12]"
          >
            🌸
          </span>
        </>
      )}

      <div className="relative z-[2] flex items-start justify-between">
        <div>
          <span className="text-sm font-bold tracking-widest">{cfg.title}</span>
          <div className="text-[9px] tracking-[.1em] opacity-80">{cfg.headerSub}</div>
        </div>
        {cfg.seal ? (
          <span
            className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ${
              cfg.seal.ring === 'dark' ? 'border border-[#1a1a1a]' : 'shadow-sm'
            }`}
          >
            <img
              src={cfg.seal.src}
              alt=""
              className="h-full w-full object-contain"
              style={cfg.seal.zoom ? { transform: `scale(${cfg.seal.zoom})` } : undefined}
            />
          </span>
        ) : (
          <span
            aria-hidden
            className="h-6 w-9 rounded-md"
            style={{
              background: 'linear-gradient(135deg,#f3d36b,#d9a93f)',
              boxShadow: 'inset 0 0 0 1.5px rgba(120,85,20,.4)',
            }}
          />
        )}
      </div>

      <div className="relative z-[2] flex items-center gap-4">
        <button
          type="button"
          onClick={onAvatarClick}
          disabled={!onAvatarClick}
          aria-haspopup="menu"
          aria-label={t('studentId.avatarMenu')}
          className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-3xl ${
            key === 'vju-mono' ? 'border border-[#1a1a1a] bg-[#f0efed]' : 'bg-white/20'
          } ${onAvatarClick ? 'cursor-pointer motion-safe:active:scale-[.97]' : ''}`}
        >
          {avatarInner}
        </button>
        <div className="min-w-0">
          {/* Uppercase in JS so textContent matches (CSS uppercase is visual-only). */}
          <div className="truncate text-lg font-semibold">
            {(name || 'STUDENT NAME').toUpperCase()}
          </div>
          <div className="text-sm opacity-90">
            {t('studentId.class')}: {className || '...'}
          </div>
          <div className="text-sm opacity-90">
            {t('studentId.major')}: {major || '...'}
          </div>
          {studentCode && (
            <div className="text-xs font-semibold tracking-[.06em]">MSSV: {studentCode}</div>
          )}
        </div>
        {key === 'vju-mono' && (
          <span
            aria-hidden
            className="z-[2] ml-auto flex h-[18px] w-[18px] items-center justify-center self-start rounded-[3px] bg-[#c0273f] text-[9px] font-bold text-white"
          >
            印
          </span>
        )}
      </div>

      <div className="relative z-[2] flex items-end justify-between text-xs opacity-90">
        <div>
          <div>{cfg.footerLeft}</div>
          <div className="opacity-70">STATUS: ACTIVE</div>
        </div>
        <span
          aria-hidden
          className="h-4 w-28"
          style={{
            color: cfg.barcode,
            background:
              'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 5px, transparent 5px 8px, currentColor 8px 11px, transparent 11px 13px)',
          }}
        />
      </div>
    </div>
  );
}
