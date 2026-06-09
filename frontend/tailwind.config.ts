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
        // Notion Colors
        primary: {
          DEFAULT: '#0075de',
          active: '#005bab',
        },
        secondary: '#213183',
        canvas: {
          DEFAULT: 'var(--canvas)',
          soft: 'var(--canvas-soft)',
        },
        surface: 'var(--surface)',
        ink: {
          DEFAULT: 'var(--ink)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        hairline: 'var(--hairline)',
        // Sticker Palette
        sticker: {
          sky: '#62aef0',
          purple: '#d6b6f6',
          'purple-deep': '#391c57',
          pink: '#ff64c8',
          orange: '#dd5b00',
          'orange-deep': '#793400',
          teal: '#2a9d99',
          green: '#1aae39',
          brown: '#523410',
        },
        // Legacy/Compatibility Aliases (pointing to new vars or keeping for transition)
        'bg-main': 'var(--canvas-soft)',
        'bg-sidebar': 'var(--canvas)',
        'bg-card': 'var(--surface)',
        'input-bg': 'var(--surface)',
        'menu-item': 'var(--hairline)',
        'text-main': 'var(--ink)',
        'text-muted': 'var(--ink-secondary)',
        'text-helper': 'var(--ink-muted)',
        border: 'var(--hairline)',
        accent: '#0075de',
      },
      backgroundImage: {
        'id-card': 'var(--id-card-bg)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '5px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
        // Legacy aliases
        token: '12px',
        card: '12px',
        timer: '16px',
        pill: '9999px',
      },
      boxShadow: {
        'level-1': '0 1px 2px rgba(0,0,0,0.02), 0 4px 18px rgba(0,0,0,0.04)',
        'level-2': '0 23px 52px rgba(0,0,0,0.05)',
        card: '0 1px 2px rgba(0,0,0,0.02), 0 4px 18px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
