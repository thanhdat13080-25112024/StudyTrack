import { useEffect, useState } from 'react';
import { useUiStore } from '@/store/uiStore';

/** Read a CSS custom property off :root, with an SSR/no-window fallback. */
export function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Ordered categorical palette for multi-series charts (pie slices, etc.).
 * Accent first (the single brand blue), then the sticker palette. Replaces the
 * old, undefined `var(--brand-emerald|gold|rose|violet)` references.
 */
export function chartSeries(): string[] {
  return [
    'var(--accent-color)',
    '#1aae39', // sticker.green
    '#dd5b00', // sticker.orange
    '#d6b6f6', // sticker.purple
    '#2a9d99', // sticker.teal
    '#ff64c8', // sticker.pink
    '#62aef0', // sticker.sky
  ];
}

export interface ChartTheme {
  accent: string;
  grid: string;
  text: string;
  card: string;
  series: string[];
  /** Recharts <Tooltip contentStyle={...}> for both palettes. */
  tooltipStyle: React.CSSProperties;
}

/** Theme-aware chart tokens; re-reads the CSS vars whenever the theme flips. */
export function useChartTheme(): ChartTheme {
  const theme = useUiStore((s) => s.theme);
  const [c, setC] = useState({ accent: '#2563eb', grid: '#1e293b', text: '#9ca3af', card: '#1e293b' });

  useEffect(() => {
    setC({
      accent: readVar('--accent-color', '#2563eb'),
      grid: readVar('--border-color', '#1e293b'),
      text: readVar('--text-helper', '#9ca3af'),
      card: readVar('--bg-card', '#1e293b'),
    });
  }, [theme]);

  return {
    ...c,
    series: chartSeries(),
    tooltipStyle: {
      background: c.card,
      border: `1px solid ${c.grid}`,
      borderRadius: 8,
      color: c.text,
    },
  };
}
