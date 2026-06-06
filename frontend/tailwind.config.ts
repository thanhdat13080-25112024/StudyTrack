import type { Config } from 'tailwindcss';

/**
 * StudyTrack design tokens.
 *
 * Colors are wired to CSS variables defined in `src/globals.css`
 * (`:root` = dark / legacy default, `.dark` mirrors it, `.light` overrides).
 * The legacy palette lived in `legacy/index.html` under `:root` (dark) and
 * `[data-theme="light"]`. Every token below maps 1:1 to one of those vars so
 * components reference tokens — never raw hex.
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
        'menu-item-text': 'var(--menu-item-text)',
        // Lines
        border: 'var(--border-color)',
        // Accent / brand
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-hover)',
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
      },
      backgroundImage: {
        'id-card': 'var(--id-card-bg)',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        // Legacy radii: 6/10/12/15/20/24px
        token: '12px',
        card: '20px',
        timer: '24px',
        pill: '15px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.08)',
        sidebar: '4px 0 20px rgba(0,0,0,0.05)',
        timer: '0 20px 50px rgba(16, 185, 129, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
