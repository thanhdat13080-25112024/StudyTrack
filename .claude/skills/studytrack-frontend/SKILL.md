---
name: studytrack-frontend
description: How to build the StudyTrack React frontend — Vite+TS+Tailwind+shadcn structure, porting the legacy CSS-var palette to Tailwind tokens, light/dark theme, react-i18next vi/en (migrating langData), TanStack Query + Zustand + WebSocket state, consuming OpenAPI-generated api-types, and the Claude-design UI workflow. Use whenever writing or changing frontend/, pages, components, hooks, stores, i18n, or theme for StudyTrack.
---

# StudyTrack Frontend Conventions

Faithfully preserve the legacy UX (bilingual vi/en, light/dark, focus timer + lofi, dashboard, schedule, badges, virtual student-ID) on a modern stack. **Bilingual and themed are non-negotiable defaults.**

## Stack & layout
React 18 + TypeScript + Vite · Tailwind + shadcn/ui (Radix) · Recharts · TanStack Query (server state) + Zustand (timer/UI) · react-router · react-i18next · react-hook-form + zod · Vitest + RTL.

```
frontend/
  src/
    pages/        # Dashboard, Focus, History, Schedule, Profile, Courses, Grades,
                  #   Roadmap, Analysis, Deadlines, Auth
    components/   # ui/ (shadcn), charts/, StudentIdCard, Timer, ...  (presentational)
    features/     # TanStack Query hooks per domain (useSessions, useGrades, ...)
    store/        # Zustand stores (timer, ui/theme)
    lib/          # apiClient, wsClient, i18n, gpa (display mirror), theme,
                  #   api-types.ts  ← GENERATED from backend OpenAPI, never hand-edit
    locales/      # vi.json, en.json
  public/         # dom.mp3 (copied from legacy)
  index.html, vite.config.ts, tailwind.config.ts, tsconfig.json, Dockerfile
```

## Design system first (single source of tokens)
Before building UI, port the legacy palette/typography/spacing/radius (the `:root` and `[data-theme="light"]` CSS vars in `legacy/index.html`) into `tailwind.config.ts` tokens + a `globals.css` with CSS variables. All components reference **tokens**, never raw hex. Light/dark switches via the Tailwind `dark` class on the root (port `toggleTheme`).

## i18n (migrate langData → react-i18next)
- Every user-facing string is `t('key')`. Adding a string means adding the key to **both** `locales/vi.json` and `locales/en.json` — never one without the other (`qa-integrator` checks key parity).
- Default language `vi`, theme `dark` (preserve legacy defaults). Persist language/theme choice.

## State
- **Server data:** TanStack Query hooks in `features/`, calling `lib/apiClient` with types from `lib/api-types.ts`.
- **Timer/UI:** Zustand store (port `totalSecondsLeft`/`initialSecondsPlanned`/`isTimerRunning` logic; the focus session still plays `dom.mp3`).
- **Realtime:** `lib/wsClient` subscribes to `/ws/notifications` (deadline reminders, weak-subject alerts, badge unlocks, dashboard sync).

## Consuming the contract
`api-types.ts` is generated from the backend OpenAPI via the `gen-types` Makefile target. **Never hand-edit it.** If a needed type is missing/wrong, the backend contract changed — flag `qa-integrator`/`backend-engineer` and request regeneration. Don't paper over with `as any`.

## Claude-design UI workflow
For a new page/component, follow this loop (full template in `docs/claude-design-workflow.md` once it exists):
1. Use the `frontend-design` skill to generate **React + TypeScript + Tailwind + shadcn**, instructed to use the project tokens (paste the token table + existing shadcn component list), not hardcoded colors → auto-matches light/dark.
2. Keep the generated piece **presentational** (props + mock data) in `components/`; the page in `pages/` wires it.
3. Replace mocks with TanStack Query hooks (real `apiClient`, OpenAPI types); timer/UI via Zustand.
4. Add `t()` keys (vi+en) and `dark:` variants.
5. Branch per UI (`feat/ui-<page>`) → wire → preview → PR.

## Testing & DoD
Vitest + RTL for component/hook logic (paste result). Manual polish check in **vi/en × light/dark**. Report `t()` keys added and any contract mismatch. Then hand to `qa-integrator`.
