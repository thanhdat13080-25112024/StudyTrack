import { describe, expect, it } from 'vitest';
import { buildPlaylist, deriveTitle, makeShuffleOrder, nextIndex, prevIndex } from './playlist';

describe('deriveTitle', () => {
  it('strips extension, splits -/_ and capitalizes', () => {
    expect(deriveTitle('lofi-rain.mp3')).toBe('Lofi Rain');
    expect(deriveTitle('night_coding.mp3')).toBe('Night Coding');
    expect(deriveTitle('dom.mp3')).toBe('Dom');
  });
});

describe('buildPlaylist', () => {
  it('maps glob output sorted by filename', () => {
    const list = buildPlaylist({
      '/src/assets/music/b-track.mp3': '/b.mp3',
      '/src/assets/music/a-track.mp3': '/a.mp3',
    });
    expect(list.map((t) => t.file)).toEqual(['a-track.mp3', 'b-track.mp3']);
    expect(list[0]).toEqual({ file: 'a-track.mp3', title: 'A Track', url: '/a.mp3' });
  });
});

describe('wrap-around', () => {
  it('next wraps last -> first; prev wraps first -> last', () => {
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(0, 3)).toBe(1);
    expect(prevIndex(0, 3)).toBe(2);
    expect(prevIndex(2, 3)).toBe(1);
  });
});

describe('makeShuffleOrder', () => {
  it('is a permutation starting at `start`, no repeats', () => {
    const order = makeShuffleOrder(5, 2, () => 0.4);
    expect(order[0]).toBe(2);
    expect([...order].sort()).toEqual([0, 1, 2, 3, 4]);
  });
  it('handles n=1', () => {
    expect(makeShuffleOrder(1, 0)).toEqual([0]);
  });
});
