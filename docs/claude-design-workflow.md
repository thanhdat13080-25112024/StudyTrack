# Claude-Design UI Workflow (stub)

> **Phase 0 stub.** The canonical, evolving version of this loop lives in the
> frontend skill: [`.claude/skills/studytrack-frontend/SKILL.md`](../.claude/skills/studytrack-frontend/SKILL.md)
> → section **"Claude-design UI workflow"**. The frontend engineer fleshes this
> doc out (with the token table + full template) as pages are built. This page
> exists so cross-references resolve and the workflow is discoverable.

## The loop (summary — see the frontend skill for the authoritative version)

For each new page/component:

1. **Generate** with the `frontend-design` skill → **React + TypeScript +
   Tailwind + shadcn**, instructed to use the project design tokens (paste the
   token table + existing shadcn component list) — never hardcoded colors, so
   light/dark match automatically.
2. **Keep it presentational** (props + mock data) under `components/`; the
   `pages/` entry wires it together.
3. **Wire real data** — replace mocks with TanStack Query hooks against the real
   `apiClient` and the OpenAPI-generated types; timer/UI state via Zustand.
4. **Localize + theme** — add `t()` keys for **vi** and **en**, add `dark:`
   variants.
5. **Branch → preview → PR** — one branch per UI (`feat/ui-<page>`), wire,
   preview, open a PR (CI gate: `test` / `lint` / `migrate-check`).

## DevOps touchpoints
- Keep `frontend/src/lib/api-types.ts` fresh via `make gen-types` whenever the
  backend OpenAPI changes (it is generated but committed).
- All UI work merges via PR; the same CI gate and `main`-auto-deploy apply
  (see [`branch-protection.md`](./branch-protection.md)).
