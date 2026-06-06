---
name: studytrack-docs
description: How to keep StudyTrack docs in sync — README.md (Vietnamese onboarding source) updated every phase, the four AI-instruction files (CLAUDE.md canonical EN, CLAUDE-VIE.md, GEMINI.md, GEMINI-VIE.md) kept consistent when conventions change, and locales vi/en key parity. Use at the end of each phase and whenever structure, commands, features, env vars, or conventions change for StudyTrack.
---

# StudyTrack Docs Conventions

The user explicitly wants docs kept in lockstep with the code to avoid drift — updating README and the AI-instruction files is part of the **Definition of Done** every phase. Document **reality** (what shipped), verified against the repo, never plans.

## README.md (Vietnamese — onboarding source of truth)
Update every phase and whenever structure/commands/features/env vars change. Keep these sections accurate:
- **Kiến trúc tổng quan** — current monorepo layout (backend/frontend/deploy) and stack.
- **Cách chạy dev** — `docker-compose up -d` (Postgres) + `make dev`; prerequisites.
- **Lệnh thường dùng** — the real Makefile targets (`make test|migrate|seed|gen-types|deploy`). Read the Makefile to confirm they exist before documenting.
- **Biến môi trường** — mirror `.env.example` (names + purpose, no real values).
- **Quy trình Git & deploy** — work branch → test → PR → squash-merge main → auto-deploy VPS.
- **Trạng thái từng phase** — which phases are done / in progress.

## Four AI-instruction files — keep consistent
- `CLAUDE.md` is the **canonical English** source. Write the change there first.
- `CLAUDE-VIE.md` is its **Vietnamese mirror** — translate faithfully.
- `GEMINI.md` / `GEMINI-VIE.md` are sibling files for the same project — mirror the same conventions (EN and VI respectively).
When a convention changes (structure, persistence, workflow, a new rule), update **all four** so they agree in meaning. Don't let them diverge.

## Harness note in CLAUDE.md
The harness pointer + change-log table live in `CLAUDE.md` under `## Harness: StudyTrack refactor`. When agents/skills are added/changed, the orchestrator records a change-log row; if you touch conventions that affect the harness, keep that section truthful too (mirror into `CLAUDE-VIE.md`).

## Locale parity
Confirm `frontend/src/locales/vi.json` and `en.json` have **identical key sets**. A key in one language but missing in the other is a bug — flag it to `frontend-engineer` (or add the obvious translation if trivial and unambiguous).

## Working rules
- **Verify before documenting.** Read the Makefile, compose files, and `.env.example` to confirm a command/var exists before writing it. If something described to you isn't actually in the repo, don't document it — report the discrepancy to the owning agent.
- **Docs only.** You edit README, the four instruction files, `docs/`, and locale key parity. You don't change code; code/doc mismatches get flagged, not silently "fixed" by editing code.
- **Preserve voice & structure.** Update in place; keep the user's existing Vietnamese terminology.
- **Conventional Commits + DoD.** Remind/record that each phase's DoD includes: tests pass, lint clean, migration runs, E2E checklist, i18n vi+en updated, README + CLAUDE.md updated.

## Output
Report files updated + key section diffs, confirm locale key parity (vi vs en), confirm the four instruction files agree. End with "docs in sync" or a list of gaps you couldn't resolve.
