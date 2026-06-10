import type { Config } from 'tailwindcss';

/**
 * StudyTrack design tokens — Notion "paper-calm" design language.
 *
 * Colors are wired to CSS variables defined in `src/globals.css`
 * (`:root` = LIGHT / default boot theme, `.dark` = the indigo "night-shift").
 * Every token below maps to one of those vars so components reference tokens —
 * never raw hex. The `sticker` palette + fixed `brand` seeds are the only
 * literal colors (decorative icon tiles / gradients).
 *
 * darkMode: 'class' — theme switches by toggling the `dark` class on <html>
 * (port of legacy `toggleTheme` which set data-theme on <body>).
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'bg-main': 'var(--bg-main)',
        'bg-sidebar': 'var(--bg-sidebar)',
        'bg-card': 'var(--bg-card)',
        'input-bg': 'var(--input-bg)',
        'menu-item': 'var(--menu-item-bg)',
        // Text
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'text-helper': 'var(--text-helper)',
        'text-faint': 'var(--text-faint)',
        'menu-item-text': 'var(--menu-item-text)',
        // Lines
        border: 'var(--border-color)',
        // Accent / brand
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-hover)',
        secondary: 'var(--secondary)',
        // Identity card
        'id-card-text': 'var(--id-card-text)',
        // Fixed brand seeds (used by gradients/borders in the legacy UI)
        brand: {
          teal: '#15928A',
          'teal-dark': '#0d6e68',
          blue: '#2563eb',
          'blue-dark': '#1d4ed8',
          emerald: '#10b981',
          gold: '#eab308',
        },
        // Notion decorative "sticker" icon-tile palette
        sticker: {
          sky: '#62aef0',
          purple: '#d6b6f6',
          purpleDeep: '#391c57',
          pink: '#ff64c8',
          orange: '#dd5b00',
          orangeDeep: '#793400',
          teal: '#2a9d99',
          green: '#1aae39',
          brown: '#523410',
        },
      },
      backgroundImage: {
        'id-card': 'var(--id-card-bg)',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        // Notion radius scale; old aliases kept pointed at the new scale so
        // existing class usage (rounded-token/card/timer/pill) stays valid.
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        token: '8px',
        card: '12px',
        timer: '16px',
        pill: '9999px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        elevated: 'var(--shadow-elevated)',
        card: 'var(--shadow-soft)',
      },
      letterSpacing: {
        display: '-0.0625em',
        heading: '-0.02em',
        tight: '-0.01em',
        eyebrow: '0.01em',
      },
    },
  },
  plugins: [],
};

export default config;
