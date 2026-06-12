import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MusicPlayer } from './MusicPlayer';

const TRACKS = [
  { file: 'a.mp3', title: 'A', url: '/a.mp3' },
  { file: 'b.mp3', title: 'B', url: '/b.mp3' },
  { file: 'c.mp3', title: 'C', url: '/c.mp3' },
];

describe('MusicPlayer (playlist)', () => {
  it('renders nothing when the playlist is empty', () => {
    const { container } = render(<MusicPlayer tracks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows current title + position and wraps next at the end', () => {
    window.localStorage.removeItem('track_music');
    render(<MusicPlayer tracks={TRACKS} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    const next = screen.getByLabelText('focus.musicNext');
    fireEvent.click(next); // -> B
    fireEvent.click(next); // -> C
    fireEvent.click(next); // wrap -> A
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('prev on first wraps to last', () => {
    window.localStorage.removeItem('track_music');
    render(<MusicPlayer tracks={TRACKS} />);
    fireEvent.click(screen.getByLabelText('focus.musicPrev'));
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });
});
