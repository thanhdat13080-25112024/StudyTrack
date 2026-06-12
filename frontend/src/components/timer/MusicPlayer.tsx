/**
 * MusicPlayer — lofi focus audio (`/dom.mp3`), port of the legacy
 * `toggleStudyMusic` / `changeMusicVolume`. Presentational: owns its own
 * `<audio>` ref, exposes a play/pause toggle and a volume slider. `autoPlay`
 * attempts playback on mount (browsers may block it; the rejection is caught).
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MusicPlayerProps {
  autoPlay?: boolean;
}

export function MusicPlayer({ autoPlay = false }: MusicPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (autoPlay) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false)); // autoplay may be blocked
    }
    // autoPlay only matters on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const onVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    // Lives on the Focus night band: glassy white-on-indigo chrome (DESIGN.md —
    // on-primary carries every signal on the secondary band, no paper tokens).
    <div className="flex items-center gap-3 rounded-md border border-white/20 bg-white/10 px-4 py-3">
      <audio ref={audioRef} src="/dom.mp3" loop preload="auto" />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="border-transparent bg-white text-[#31302e] shadow-none hover:bg-white/90"
        onClick={toggle}
        aria-label={playing ? t('focus.musicPause') : t('focus.musicPlay')}
      >
        {playing ? (
          <Pause className="h-4 w-4" aria-hidden />
        ) : (
          <Play className="h-4 w-4" aria-hidden />
        )}
      </Button>
      <span className="text-sm font-medium text-white">{t('focus.music')}</span>
      <div className="ml-auto flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-white/70" aria-hidden />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label={t('focus.volume')}
          className="h-1.5 w-28 cursor-pointer accent-accent"
        />
      </div>
    </div>
  );
}
