/**
 * Pure playlist logic for the Focus music player. Tracks are auto-discovered
 * from src/assets/music/*.mp3 (drop-and-go — no manifest); titles derive from
 * filenames. Kept free of React/DOM so vitest covers it directly.
 */

export interface Track {
  file: string;
  title: string;
  url: string;
}

/** `lofi-rain.mp3` -> "Lofi Rain"; `night_coding.mp3` -> "Night Coding". */
export function deriveTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Glob map (path -> url) to a stable, filename-sorted playlist. */
export function buildPlaylist(globMap: Record<string, string>): Track[] {
  return Object.entries(globMap)
    .map(([path, url]) => {
      const file = path.split('/').pop() ?? path;
      return { file, title: deriveTitle(file), url };
    })
    .sort((a, b) => a.file.localeCompare(b.file));
}

export const nextIndex = (i: number, n: number): number => (i + 1) % n;
export const prevIndex = (i: number, n: number): number => (i - 1 + n) % n;

/**
 * Fisher-Yates permutation of [0..n) with `start` first — one shuffle "cycle"
 * plays every track exactly once. `rng` is injectable for tests.
 */
export function makeShuffleOrder(
  n: number,
  start: number,
  rng: () => number = Math.random,
): number[] {
  const rest = Array.from({ length: n }, (_, i) => i).filter((i) => i !== start);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [start, ...rest];
}
