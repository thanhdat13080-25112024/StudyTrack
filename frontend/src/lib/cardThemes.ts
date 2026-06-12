/**
 * Visual config for the 4 student-ID card themes (mockup v5, 2026-06-12 spec).
 * Card text (STUDENT CARD, university names) is deliberate brand/EN text, not
 * i18n. Themes are card-intrinsic: invariant across light/dark, like the Focus
 * night band (DESIGN.md theme-invariant hardcodes).
 */
import type { CSSProperties } from 'react';

export type CardTheme = 'studytrack' | 'vju-mono' | 'vju-red' | 'vnu-green';

export const CARD_THEMES: CardTheme[] = ['studytrack', 'vju-mono', 'vju-red', 'vnu-green'];

export interface CardThemeConfig {
  /** Inline style for the card face (gradients/patterns — theme-invariant). */
  card: CSSProperties;
  /** Main text class ('text-white' | dark ink). */
  text: string;
  title: string;
  headerSub: string;
  footerLeft: string;
  /** Barcode color (currentColor of the barcode span). */
  barcode: string;
  seal?: { src: string; zoom?: number; ring?: 'dark' };
  watermark?: {
    src: string;
    white?: boolean;
    size: number;
    right: number;
    bottom: number;
    zoom?: number;
  };
  /** Swatch gradient for the theme picker. */
  swatch: string;
}

export const cardThemes: Record<CardTheme, CardThemeConfig> = {
  studytrack: {
    card: {
      backgroundImage:
        'radial-gradient(circle at 85% 15%, rgba(255,255,255,.14) 0, transparent 45%), radial-gradient(rgba(255,255,255,.08) 1px, transparent 1.5px), linear-gradient(135deg,#1e2a5a 0%,#3b4a8c 60%,#5061a8 100%)',
      backgroundSize: 'auto, 18px 18px, auto',
      border: '1px solid rgba(255,255,255,.15)',
    },
    text: 'text-white',
    title: 'STUDENT CARD',
    headerSub: 'FOCUS · TRACK · ACHIEVE',
    footerLeft: 'SYSTEM: STUDYTRACK',
    barcode: 'rgba(255,255,255,.85)',
    swatch: 'linear-gradient(135deg,#1e2a5a,#5061a8)',
  },
  'vju-mono': {
    card: {
      background: '#ffffff',
      border: '1.5px solid #1a1a1a',
      boxShadow: 'inset 0 0 0 4px #fff, inset 0 0 0 5px #1a1a1a',
    },
    text: 'text-[#1a1a1a]',
    title: 'VJU · STUDENT CARD',
    headerSub: 'VIETNAM JAPAN UNIVERSITY · SINCE 1906',
    footerLeft: 'VIETNAM JAPAN UNIVERSITY',
    barcode: '#1a1a1a',
    seal: { src: '/logos/vju-reverse.png', ring: 'dark' },
    watermark: { src: '/logos/vju-reverse.png', size: 150, right: -38, bottom: -42 },
    swatch: 'linear-gradient(135deg,#ffffff 55%,#1a1a1a 55%)',
  },
  'vju-red': {
    card: {
      backgroundImage:
        'repeating-radial-gradient(circle at 50% 130%, transparent 0 22px, rgba(255,255,255,.05) 22px 23px), linear-gradient(135deg,#8e1428 0%,#b32036 55%,#c93a4e 100%)',
    },
    text: 'text-white',
    title: 'VJU · STUDENT CARD',
    headerSub: 'VIETNAM JAPAN UNIVERSITY · SINCE 1906',
    footerLeft: 'VIETNAM JAPAN UNIVERSITY',
    barcode: 'rgba(255,255,255,.85)',
    seal: { src: '/logos/vju.png', zoom: 1.75 },
    watermark: {
      src: '/logos/vju.png',
      white: true,
      size: 210,
      right: -70,
      bottom: -78,
      zoom: 1.5,
    },
    swatch: 'linear-gradient(135deg,#8e1428,#c93a4e)',
  },
  'vnu-green': {
    card: {
      backgroundImage:
        'repeating-linear-gradient(115deg, transparent 0 26px, rgba(255,255,255,.045) 26px 27px), linear-gradient(135deg,#07432a 0%,#0d6b41 55%,#168a54 100%)',
      boxShadow: 'inset 0 0 0 1.5px rgba(243,211,107,.55)',
    },
    text: 'text-white',
    title: 'VNU · STUDENT CARD',
    headerSub: 'ĐẠI HỌC QUỐC GIA HÀ NỘI',
    footerLeft: 'VIETNAM NATIONAL UNIVERSITY, HANOI',
    barcode: '#f3d36b',
    seal: { src: '/logos/vnu.png' },
    swatch: 'linear-gradient(135deg,#07432a,#168a54)',
  },
};

export const DEFAULT_CARD_THEME: CardTheme = 'studytrack';

export function asCardTheme(value: string | null | undefined): CardTheme {
  return CARD_THEMES.includes(value as CardTheme) ? (value as CardTheme) : DEFAULT_CARD_THEME;
}
