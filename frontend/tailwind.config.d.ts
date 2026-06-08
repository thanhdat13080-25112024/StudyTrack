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
declare const config: Config;
export default config;
