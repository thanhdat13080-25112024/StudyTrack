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
    <div className="flex items-center gap-3 rounded-md border border-border bg-bg-card/40 px-4 py-3">
      <audio ref={audioRef} src="/dom.mp3" loop preload="auto" />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggle}
        aria-label={playing ? t('focus.musicPause') : t('focus.musicPlay')}
      >
        {playing ? (
          <Pause className="h-4 w-4" aria-hidden />
        ) : (
          <Play className="h-4 w-4" aria-hidden />
        )}
      </Button>
      <span className="text-sm font-medium text-text-main">{t('focus.music')}</span>
      <div className="ml-auto flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-text-muted" aria-hidden />
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
