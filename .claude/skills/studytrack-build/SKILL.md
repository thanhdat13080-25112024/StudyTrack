---
name: studytrack-build
description: Orchestrator for the StudyTrack full-stack refactor (FastAPI + Postgres + React/Vite + WebSocket, self-hosted VPS). Drives the phased plan (Phase 0 scaffold → 1 auth → 2 study-habit → 3 GPA/CPA → 4 curriculum/roadmap → 5 deadlines/realtime → 6 AI) via subagent-driven development with git flow, TDD, code review, and doc sync. USE for any StudyTrack refactor work — "bắt đầu phase N", "start/continue phase N", "tiếp tục refactor", "build the backend/frontend", "re-run / redo / fix / update phase N", "chỉ làm lại phần X của phase N". For simple one-off questions, answer directly.
---

# StudyTrack Build Orchestrator

You coordinate a team of specialist subagents to execute the StudyTrack refactor plan, one phase per work branch, keeping `main` always-green and auto-deployable. Read this whole file, then drive.

**Announce:** "Using studytrack-build to orchestrate Phase N."

## Inputs you must have loaded
- **Plan:** `/Users/thanhdat/.claude/plans/hi-n-t-i-d-n-n-y-serialized-mist.md` — the full refactor spec (DB schema, services, repo layout, deploy). Read it before any phase if not already in context.
- **Project memory:** `studytrack-refactor` (decisions/phases) and `studytrack-dev-workflow` (git flow, README discipline). Honor both.

## Team (defined in `.claude/agents/`)
| Agent | Owns | Skill it follows |
|-------|------|------------------|
| `backend-engineer` | FastAPI, models, schemas, routers, services (TDD), Alembic, auth | `studytrack-backend` |
| `frontend-engineer` | React/TS/Vite/Tailwind/shadcn, hooks, stores, i18n, theme | `studytrack-frontend` |
| `devops-engineer` | docker-compose, CI/CD, nginx/wss/certbot, Makefile, pre-commit, gen-types, seed, backup | `studytrack-devops` |
| `qa-integrator` | cross-boundary contract + runtime + E2E verification | `studytrack-qa` |
| `docs-keeper` | README (vi) + 4 AI-instruction files + locale parity | `studytrack-docs` |

**Every `Agent` call passes `model: "opus"`.** Spawn an agent by `subagent_type` matching the agent name; the task prompt tells it the phase, the files/contract, and "read your skill `.claude/skills/<x>/SKILL.md` first."

## Execution mode — hybrid subagent-driven (with worktree isolation)
This environment has the `Agent` tool (not a TeamCreate/SendMessage team framework), so use **subagent-driven development** (`superpowers:subagent-driven-development`).

- **Fan-out:** within a phase, dispatch independent build agents. If two build agents may touch overlapping files, give each `isolation: "worktree"` so they work on isolated copies, then integrate. Agents on clearly-disjoint trees (e.g. `backend/` vs `frontend/` vs `deploy/`) can run in parallel via `run_in_background: true` on the same branch.
- **Fan-in:** after build agents land, run `qa-integrator` to verify the seam (it is the integration gate).
- **Docs last:** run `docs-keeper` after QA is green, so docs describe what actually shipped.
- **You (orchestrator)** stay on the phase work branch in the main working dir, integrate worktree outputs, review, and decide the merge.

## Per-phase workflow (run every phase)

**1. Context check (initial / resume / partial).** Before dispatching:
- New phase, nothing built → **initial**.
- Phase files exist + user says "fix/continue/update/redo part X" → **partial** — re-dispatch only the owning agent(s) with the prior artifacts to extend; don't rebuild from scratch.
- User gave fresh requirements over old output → **new run** — note what's superseded.
Confirm the branch state: you must be on a fresh work branch off `main`, never on `main`.

**2. Branch.** Create the phase work branch off `main`: `feat/p<N>-<scope>` (e.g. `feat/p0-scaffold`). Conventional Commits. If isolating, use `superpowers:using-git-worktrees`.

**3. Brainstorm (for net-new feature design).** For phases introducing new product behavior (1–6), invoke `superpowers:brainstorming` to settle requirements/design with the user before building. Phase 0 (pure scaffold) can skip straight to build.

**4. Build (fan-out).** Dispatch the phase's build agents (see phase map). Each agent: reads its skill, builds test-first where applicable (`backend-engineer` MUST use `superpowers:test-driven-development` for services), reports files + test output + the contract it exposed/consumed. Collect their reports; integrate any worktree outputs onto the branch.

**5. Verify (fan-in).** Dispatch `qa-integrator` with the list of modules/contracts touched. It cross-checks boundaries (OpenAPI↔api-types↔hooks), runs `make test` / `alembic upgrade head` / `make gen-types` sync, walks the E2E checklist in **vi/en × light/dark**, and returns PASS/FAIL + evidence. Route any mismatch back to the owning agent and re-verify. Do not proceed until QA is green.

**6. Docs.** Dispatch `docs-keeper` to update README + the four AI-instruction files + confirm locale parity for what shipped.

**7. Review + finish.** Apply `superpowers:requesting-code-review` on the branch diff; address findings via `superpowers:receiving-code-review`. Then `superpowers:verification-before-completion` (re-run the green checks, paste output) before claiming done. Finally `superpowers:finishing-a-development-branch` to open the PR / squash-merge to `main` (which triggers auto-deploy from Phase 0 onward). Never merge with red CI.

**8. Evolve harness.** After the phase, offer the user a feedback pass; reflect changes into agents/skills and log them in the `CLAUDE.md` harness change-log (see harness skill Phase 7).

## Commit & branch conventions
- **Branch off `main`** per unit of work: `feat/<scope>`, `fix/<scope>`, `chore/<scope>` (phase-prefixed, e.g. `feat/p0-scaffold`). Never commit to `main` directly.
- **Commit messages depend on the branch:**
  - On **`main`** (the squash-merge/release commit): `x.x.x : message` — `x.x.x` is a semver bumped by the **magnitude** of the change (major = large/architectural/breaking, minor = new feature or phase, patch = small fix/docs); the text after ` : ` is a normal message. Matches existing history (`1.0.0 : First Version`). Confirm the exact version with the user at merge time.
  - On **feature/work branches** (`feat/`/`fix/`/`chore/`/`work`): normal Conventional-Commit messages; the `x.x.x` prefix is **not** required.
- **Push/PR is user-gated:** commit locally, then ask the user before `git push` / opening a PR (unless they say otherwise for the session).
- Every commit message you author ends with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` footer.

## Checkpoint discipline (resumability — don't lose work to limits)
Long multi-wave work risks hitting a usage/context limit mid-flight. To make any session resumable with zero re-derivation, **checkpoint proactively** — don't wait until "near limit":
- Maintain a single progress memory (`studytrack-phase<N>-progress`) and **refresh it at every milestone**: after each wave/agent batch completes, before any long or risky operation, and whenever context feels heavy. Record: branch state (committed vs uncommitted), what's on disk, what's verified, known blockers (with exact fix), and an ordered **NEXT ACTIONS** list.
- When the working tree is in a consistent state, **commit a WIP checkpoint** on the feature branch (normal message, e.g. `wip: phase N <area>`) so code can't be lost; squash later before merge.
- Capture finished subagents' key outputs (contracts, file lists, blockers) into the memory immediately — background agents' reports are lost when the session ends.
- **On resume:** read the progress memory FIRST, re-confirm the working tree (`git status`), then continue from NEXT ACTIONS. Trigger: "tiếp tục/bắt đầu lại phase N".

## Phase map (which agents, what to build)
- **Phase 0 — Scaffold + rails:** `devops-engineer` (lead: monorepo dirs, **`.gitignore` (clean repo — no `node_modules`/`__pycache__`/`.env`/build artifacts/`_workspace/`)**, docker-compose dev, Makefile, pre-commit, ci.yml, deploy.yml + deploy/ nginx/certbot, .env.example, gen-types, branch-protection doc, pg_dump cron doc) + `backend-engineer` (FastAPI skeleton + `core/` + Alembic init + `/api/health` + seed stub) + `frontend-engineer` (Vite+React+TS+Tailwind+shadcn init + token port from legacy + i18n bootstrap) + move legacy `index.html`/`main.*`/`dom.mp3` into `legacy/`. `qa-integrator` confirms `make dev`/`make test`/`alembic upgrade head` run and the skeleton boots. `docs-keeper` initializes `README.md`. *No brainstorming step.*
- **Phase 1 — Auth + user:** backend (JWT+argon2, User/Profile, auth+profile routers, tests) + frontend (Auth pages, profile + virtual student-ID, i18n+theme wired) + qa + docs.
- **Phase 2 — Study-habit port:** backend (StudySession, schedule, streak, dashboard, suggestions services + tests) + frontend (Focus timer + dom.mp3, History, Schedule, Dashboard KPI + 7-day Recharts, badges) + qa + docs.
- **Phase 3 — Academic core:** backend (Course/Semester/Grade models, `gpa_engine` + what-if, TDD-heavy) + frontend (Courses, Grades+GPA, what-if UI, gpa.ts mirror) + qa + docs.
- **Phase 4 — Curriculum & roadmap:** backend (Prerequisite, `roadmap_engine` topo-sort, `weak_subject`, `direction_analysis`, session↔course link; TDD) + frontend (Roadmap, Analysis pages) + qa + docs.
- **Phase 5 — Deadlines + realtime:** backend (Deadline, Notification, `/ws/notifications`) + frontend (Deadlines page, wsClient, live alerts) + devops (nginx wss verified) + qa + docs.
- **Phase 6 — AI layer:** backend (Claude API proxy hiding the key — read the `claude-api` skill for current model IDs/params) upgrading weak-subject/roadmap/advice + frontend surfacing + qa + docs.

## Data passing
- **Primary: the repo itself** on the work branch — agents read/write real files.
- **Coordination notes / cross-agent contracts:** `_workspace/` at repo root (gitignored), file convention `p<N>_<agent>_<artifact>.md` (e.g. `p0_devops_makefile-targets.md`). Preserve `_workspace/` for audit; only the repo + docs are the user-facing output.
- **Agent reports:** returned in each subagent's final message — capture the contract/test-output lines and pass them to downstream agents.

## Error handling
- A build agent fails or blocks → retry once with the corrected/expanded prompt; if it fails again, stop that thread, keep other agents' good output, and report the blocker to the user (don't fake completion). Use `superpowers:systematic-debugging` for test/runtime failures.
- Conflicting outputs from two agents → don't delete; surface both with their source and resolve with the user or QA.
- Can't run something (no Docker/network) → report as skipped with reason; never claim an unrun check passed.

## Test scenarios
- **Normal:** user says "bắt đầu phase 0" → context check (initial) → branch `feat/p0-scaffold` → dispatch devops+backend+frontend (parallel/worktree) → integrate → qa verifies skeleton boots + `make` targets work → docs init README → review → PR/merge → auto-deploy smoke (`/api/health`) → offer feedback pass.
- **Error:** during Phase 3, `gpa_engine` pytest fails on the CPA edge case → backend-engineer applies systematic-debugging, fixes, re-greens; qa re-runs contract check; only then proceed. If frontend `api-types.ts` is stale, route to devops `make gen-types`, re-verify.
- **Partial re-run:** "chỉ sửa lại weak_subject của phase 4" → context check (partial) → re-dispatch only backend-engineer with the existing service + tests → qa re-verifies that boundary → docs note → PR.
