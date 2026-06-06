---
name: studytrack-qa
description: How to run integration QA on StudyTrack — cross-boundary contract checks (OpenAPI ↔ api-types.ts ↔ FE hooks, API response ↔ UI shape), runtime checks (pytest/vitest, alembic upgrade on fresh DB, gen-types sync), and the per-phase E2E checklist in vi/en × light/dark. Use to verify a phase before code review/PR, after each module lands. Compares both sides of every interface; reports evidence, never asserts without output.
---

# StudyTrack QA — Integration Correctness

Your value is **cross-boundary comparison**, not existence checks. Most real bugs in a FE/BE split live at the seam: a renamed field, a casing mismatch, a nullable the UI didn't expect, a stale generated type.

## The boundary-bug patterns to hunt
1. **Field name / casing drift** — BE `due_at` vs FE `dueAt`; BE `grade_4` vs FE `grade4`. Read both sides, compare literally.
2. **Stale generated types** — `api-types.ts` not regenerated after a schema change. Run `make gen-types`; if `git diff --stat` is non-empty afterward, types were stale → FAIL.
3. **Nullability gaps** — BE returns `course_id: null` (unlinked session) but the FE hook/types assume non-null. Confirm optional/`| null` matches.
4. **Shape vs name** — an endpoint named `/dashboard` that returns a different object than the `useDashboard` hook destructures. Read the Pydantic response model AND the hook.
5. **Enum/string mismatch** — `method`/`status`/`category` literals differ between BE and FE unions.
6. **i18n key parity** — a `t('key')` used in FE with the key only in `vi.json` (or only `en.json`).
7. **Migration ↔ model drift** — model fields with no migration; `alembic upgrade head` on a fresh DB must reproduce the schema the code expects.

## Method (incremental, evidence-based)
Run **after each module lands**, not once at the end. For every check, paste the actual output (`superpowers:verification-before-completion`).

- **Runtime:** `make test` (pytest + vitest) → paste summaries. `alembic upgrade head` on a fresh/empty DB → paste the migration log. `make gen-types` then `git diff --stat frontend/src/lib/api-types.ts` → must be empty.
- **Contract:** for each endpoint touched this phase, open the Pydantic response schema AND the FE hook + `api-types.ts` entry side by side; tabulate field → BE type → FE type → match? Flag every row that differs.
- **i18n:** confirm `vi.json` and `en.json` have identical key sets for keys added this phase.
- **E2E:** walk the phase's feature path end to end; for any UI, repeat in **vi and en**, and **light and dark**.

## Reporting
Produce a table of checks with PASS/FAIL + pasted evidence, then a mismatch list: `boundary → field → expected vs actual → owning agent`. Verdict line: **"Phase verified — ready for review"** or **"Blocked: <list>"**. A check you couldn't run is reported as SKIPPED with the reason — never silently PASS.

## Boundaries of your role
You verify and report; you don't rewrite another agent's module. Route defects to `backend-engineer` (contract source), `frontend-engineer` (consumer), or `devops-engineer` (pipeline). Trivial typo-level fixes may be suggested inline. Use `superpowers:systematic-debugging` to find root cause before declaring a phase blocked.
