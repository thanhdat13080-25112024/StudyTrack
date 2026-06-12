import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Flame, GraduationCap, Sparkles, Timer } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';

type Variant = 'login' | 'register';

type Sticker = { Icon: typeof Timer; color: string; top: string; left: string };

// Per-variant decorative sticker constellations (fixed positions + sticker colors)
// so the login and register heroes read as visually distinct surfaces.
const STICKERS: Record<Variant, Sticker[]> = {
  login: [
    { Icon: Timer, color: '#62aef0', top: '16%', left: '12%' },
    { Icon: Flame, color: '#ff64c8', top: '30%', left: '70%' },
    { Icon: GraduationCap, color: '#1aae39', top: '64%', left: '18%' },
    { Icon: BookOpen, color: '#d6b6f6', top: '74%', left: '66%' },
  ],
  register: [
    { Icon: Sparkles, color: '#d6b6f6', top: '18%', left: '66%' },
    { Icon: GraduationCap, color: '#62aef0', top: '34%', left: '14%' },
    { Icon: BookOpen, color: '#ff64c8', top: '60%', left: '70%' },
    { Icon: Flame, color: '#1aae39', top: '74%', left: '20%' },
  ],
};

// Login = solid deep-indigo "night" band; register = a brighter blue→indigo
// gradient so switching pages is an obvious change of scene. Both keep white type.
const BG: Record<Variant, string> = {
  login: 'bg-secondary',
  register: 'bg-gradient-to-br from-[#0075de] via-[#2a52be] to-[#213183]',
};

export function AuthHero({ variant }: { variant: Variant }) {
  const { t } = useTranslation();
  const stickers = STICKERS[variant];
  const stickerWrapRef = useRef<HTMLDivElement>(null);

  // Sticker pop-in: the one allowed overshoot (decorative auth hero only).
  useGSAP(
    () => {
      const wrap = stickerWrapRef.current;
      if (!wrap) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(wrap.children, {
          opacity: 0,
          scale: 0.6,
          duration: 0.4,
          ease: 'back.out(1.6)',
          stagger: 0.1,
        });
      });
      return () => mm.revert();
    },
    { dependencies: [variant], scope: stickerWrapRef },
  );

  return (
    <div
      className={`relative flex h-full flex-col justify-between overflow-hidden p-10 text-white ${BG[variant]}`}
    >
      <span className="text-lg font-bold tracking-heading">{t('app.name')}</span>
      <div className="relative max-w-sm">
        <h2 className="text-3xl font-bold leading-tight tracking-display">{t('app.tagline')}</h2>
        <p className="mt-3 text-base text-white/70">
          {t(variant === 'login' ? 'auth.heroLogin' : 'auth.heroRegister')}
        </p>
      </div>
      <div ref={stickerWrapRef} className="pointer-events-none absolute inset-0" aria-hidden>
        {stickers.map(({ Icon, color, top, left }, i) => (
          <span
            key={`${variant}-${i}`}
            className="absolute inline-flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ top, left, backgroundColor: `${color}26`, color }}
          >
            <Icon className="h-6 w-6" />
          </span>
        ))}
      </div>
    </div>
  );
}
