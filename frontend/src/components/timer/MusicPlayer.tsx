/**
 * MusicPlayer — playlist player on the Focus night band (compact single row).
 * Tracks are auto-discovered from src/assets/music/*.mp3 (drop-and-go, no
 * manifest); titles derive from filenames. Presentational: owns its <audio>;
 * prev/next wrap around; shuffle plays a no-repeat permutation per cycle.
 * Volume + current track + shuffle persist in localStorage (`track_music`).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildPlaylist,
  makeShuffleOrder,
  nextIndex,
  prevIndex,
  type Track,
} from '@/features/music/playlist';

const GLOB = import.meta.glob('@/assets/music/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const STORAGE_KEY = 'track_music';

interface Persisted {
  volume: number;
  trackFile: string | null;
  shuffle: boolean;
}

function loadPersisted(): Persisted {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { volume: 0.6, trackFile: null, shuffle: false, ...JSON.parse(raw) };
  } catch {
    /* corrupted storage -> defaults */
  }
  return { volume: 0.6, trackFile: null, shuffle: false };
}

function savePersisted(p: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota/private mode -> ignore */
  }
}

interface MusicPlayerProps {
  autoPlay?: boolean;
  /** Test override; defaults to the asset-folder auto-discovery. */
  tracks?: Track[];
}

export function MusicPlayer({ autoPlay = false, tracks }: MusicPlayerProps) {
  const { t } = useTranslation();
  const playlist = useMemo(() => tracks ?? buildPlaylist(GLOB), [tracks]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [persisted] = useState(loadPersisted);
  const initialIdx = Math.max(
    0,
    playlist.findIndex((tr) => tr.file === persisted.trackFile),
  );
  const [idx, setIdx] = useState(initialIdx);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(persisted.volume);
  const [shuffle, setShuffle] = useState(persisted.shuffle);
  // Shuffle cycle: permutation order + position (regenerated per cycle/toggle).
  const orderRef = useRef<{ order: number[]; pos: number } | null>(null);

  const current = playlist[idx] ?? null;

  useEffect(() => {
    if (!current) return;
    savePersisted({ volume, trackFile: current.file, shuffle });
  }, [volume, shuffle, current]);

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

  if (playlist.length === 0 || !current) return null;

  const playCurrent = () => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const goTo = (target: number) => {
    setIdx(target);
    // src changes on render; resume playback once the new source is in place.
    requestAnimationFrame(() => {
      if (playing) playCurrent();
    });
  };

  const stepShuffle = (dir: 1 | -1): number => {
    let cyc = orderRef.current;
    if (!cyc || cyc.order.length !== playlist.length) {
      cyc = { order: makeShuffleOrder(playlist.length, idx), pos: 0 };
    }
    let pos = cyc.pos + dir;
    if (pos >= cyc.order.length) {
      // cycle exhausted -> fresh permutation seeded at the current track
      cyc = { order: makeShuffleOrder(playlist.length, idx), pos: 0 };
      pos = 1 % cyc.order.length;
    } else if (pos < 0) {
      pos = cyc.order.length - 1;
    }
    orderRef.current = { ...cyc, pos };
    return cyc.order[pos];
  };

  const next = () => goTo(shuffle ? stepShuffle(1) : nextIndex(idx, playlist.length));
  const prev = () => goTo(shuffle ? stepShuffle(-1) : prevIndex(idx, playlist.length));

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      playCurrent();
    }
  };

  const toggleShuffle = () => {
    orderRef.current = null; // restart the cycle on re-enable
    setShuffle((s) => !s);
  };

  const onVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const ghost =
    'h-8 w-8 border-transparent bg-transparent text-white/85 shadow-none hover:bg-white/10';

  return (
    // Lives on the Focus night band: glassy white-on-indigo chrome (DESIGN.md —
    // on-primary carries every signal on the secondary band, no paper tokens).
    <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-3">
      <audio ref={audioRef} src={current.url} preload="auto" onEnded={next} />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={ghost}
        onClick={prev}
        aria-label={t('focus.musicPrev')}
      >
        <SkipBack className="h-4 w-4" aria-hidden />
      </Button>
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
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={ghost}
        onClick={next}
        aria-label={t('focus.musicNext')}
      >
        <SkipForward className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={`${ghost} ${shuffle ? 'bg-white/15 text-white' : ''}`}
        onClick={toggleShuffle}
        aria-pressed={shuffle}
        aria-label={shuffle ? t('focus.musicShuffleOff') : t('focus.musicShuffleOn')}
      >
        <Shuffle className="h-4 w-4" aria-hidden />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{current.title}</p>
        <p className="text-[11px] text-white/60">
          {idx + 1} / {playlist.length}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-white/70" aria-hidden />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label={t('focus.volume')}
          className="h-1.5 w-24 cursor-pointer accent-accent"
        />
      </div>
    </div>
  );
}
