# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

StudyTrack is a single-page study-habit manager (Pomodoro timer, dashboard, weekly scheduler, achievement badges, virtual student ID). It is bilingual (Vietnamese/English) with light/dark themes, deployed at https://studytrack-mzds.vercel.app/.

> **Note — where the active project lives:** the detailed single-file documentation in the rest of this file now describes the **legacy app in `legacy/`** (`legacy/index.html`), kept for reference. The active project is the **full-stack monorepo** (`backend/` FastAPI + Postgres, `frontend/` React/Vite, `deploy/`). For the current architecture, run commands, and Git/deploy flow, start with the root `README.md`, the `## Harness: StudyTrack refactor` section just below, and `make dev` / `make help`. The single-file guidance below is still accurate for `legacy/` but does not describe the new stack.

## Harness: StudyTrack refactor

**Goal:** drive the StudyTrack full-stack refactor (FastAPI + Postgres + React/Vite + WebSocket, self-hosted VPS) as a phased, always-green, auto-deployed pipeline.

**Trigger:** for any refactor work — "bắt đầu/tiếp tục phase N", "start/continue/redo/fix phase N", "build backend/frontend", "re-run part X" — use the `studytrack-build` orchestrator skill. It coordinates 5 specialist subagents (`backend-engineer`, `frontend-engineer`, `devops-engineer`, `qa-integrator`, `docs-keeper` in `.claude/agents/`) over their skills in `.claude/skills/studytrack-*`, wiring in the installed superpowers skills (TDD, brainstorming, code-review, finishing-a-development-branch, using-git-worktrees, verification-before-completion, systematic-debugging) and the `frontend-design` / `claude-api` skills. Simple one-off questions: answer directly, no harness.

**Change log:**
| Date | Change | Target | Reason |
|------|--------|--------|--------|
| 2026-06-06 | Initial harness (5 agents + 5 domain skills + orchestrator) | all | Phase 0 of the refactor |

## Running

No build step or package manager — it is vanilla HTML/CSS/JS loading Chart.js and Canvas Confetti from CDNs (requires internet). Serve over HTTP rather than `file://` so `dom.mp3` and assets load:

```bash
python3 -m http.server 8000   # or: npx serve .
```

There is no test or lint setup.

## Architecture

**Everything lives in `index.html`** as a deliberate single-file component — all `<style>`, markup, and `<script>` logic are inline. `main.css` and `main.js` exist but are intentionally empty; do not move code into them unless a refactor is explicitly requested. `dom.mp3` is the lofi focus-session audio.

The app is a set of `content-section` divs (`#dashboard-section`, `#profile-section`, `#study-section`, `#history-section`, `#login-section`) toggled by a **hash-based router**:
- `navigateTo(pageId)` only sets `window.location.hash`; it does **not** show the page itself.
- `renderSection()` is the real dispatcher — it listens to `window.addEventListener('hashchange', …)`, hides every `.content-section`, then shows `#{page}-section` and marks `#nav-{page}` active. It also enforces auth: logged-out users are forced to `login`; a logged-in user landing on `#login` is bounced to `dashboard`. After routing it calls `updateStreakLogic()` + `updateUIAndDashboard()`.
- A page is `{name}` ⇒ needs a `#{name}-section` div and (optionally) a `#nav-{name}` menu `<li>`. No registration table — the id convention *is* the wiring.

**Event wiring is inline `onclick="fn()"` in the markup**, not `addEventListener`. To hook up a new button, add the `onclick` attribute and define a top-level `function fn()` in the `<script>`. All handler functions are global by virtue of being script-scoped.

State is held in module-level vars (`isLoggedIn`, `currentUser`, `userDatabase`, `currentLang`, `currentTheme`, plus timer/chart vars `countdownInterval`, `totalSecondsLeft`, `initialSecondsPlanned`, `isTimerRunning`, `myChartInstance`) and mirrored to `localStorage` through `saveState()`.

### Persistence — all keys prefixed `track_`
- `track_isLoggedIn` — boolean (written by `saveState()`)
- `track_currentUser` — JSON of the active user object (written by `saveState()`)
- `track_userDatabase` — array of all registered users; persist changes via `updateUserInDatabase()`
- `track_theme` (`light`/`dark`, default `dark`), `track_lang` (`vi`/`en`, default `vi`)

**`currentUser` shape** (created in `handleRegister()`):
```js
{ name, email, pass, streak: 0, logs: [], schedules: [],
  profile: { class: '', major: '', goal: '', avatarData: '' } }
```
- `logs[]` — `{ subject, duration, plannedDuration, focus, method, note, date }`. `date` is `DD/MM/YYYY` via `toLocaleDateString('vi-VN')`; newest is `unshift`ed to the front.
- `schedules[]` — `{ day, time, subject }`. `day` is a Vietnamese day string from the module-level `daysOfWeek` array (`daysOfWeekEn` is the display translation).
- `streak` is a **computed-and-stored** number: `updateStreakLogic()` recomputes it from unique `logs[].date` and writes it back onto `currentUser`.
- **Badges are NOT stored** — `updateBadgeUI(logs)` derives them every render and only toggles the `.unlocked` CSS class on `#badge-1/2/3`. Thresholds: ≥1 session, ≥5h total, ≥20h total. To add a badge, add the markup + a threshold check there.

Authentication is local-only (no backend); registration/login just read/write `track_userDatabase`. **Passwords are stored in plaintext** in `localStorage` — this is an intentional offline demo, not production auth. Do not add real hashing/backend unless explicitly asked (see the target-design spec below for the intended hashed `pass`).

## Conventions to preserve

- **Localization:** all user-facing strings come from the `langData` dictionary. `applyLanguagePack()` renders by **hand-written, element-by-element assignment** (`document.getElementById('lbl-x').innerText = p.x`) — it does NOT auto-scan the DOM. So a new string needs three edits: (1) add the key under both `langData.vi` and `langData.en`, (2) give the element a stable `id`, (3) add the matching `getElementById(...).innerText = p.key` line in `applyLanguagePack()`. Never hardcode display strings.
  - *Known inconsistency:* some dynamically-rendered text (history items in `updateUIAndDashboard()`, the streak "ngày/days" suffix) uses inline `currentLang === 'vi' ? … : …` ternaries instead of `langData`. Follow `langData` for new code; only use a ternary where you're matching that existing pattern in the same render function.
- **Theming:** colors are CSS variables under `:root` (and `[data-theme="light"]`); switch themes by setting the `data-theme` attribute on `<body>` via `toggleTheme()`, not by editing rules. The Chart.js chart reads `currentTheme` for its colors, so theme changes call `initOrUpdateWeeklyChart()` to recolor it.
- **Dashboard/streak/badges** recompute from `currentUser`'s data via `updateUIAndDashboard()`, `updateStreakLogic()`, and `updateBadgeUI()` — update those rather than writing dashboard values directly.

## Key functions (as-built map)

Everything is one `<script>` block at the bottom of `index.html`. Where to look:

| Area | Functions |
|------|-----------|
| Routing | `navigateTo()`, `renderSection()`, `toggleAuthForm()` |
| Auth | `handleRegister()`, `handleLogin()`, `handleLogout()` |
| Persistence | `saveState()`, `updateUserInDatabase()` |
| Dashboard render | `updateUIAndDashboard()` (greeting, KPI cards, history list, chart, badges, calendar) |
| Streak / chart / badges | `updateStreakLogic()`, `initOrUpdateWeeklyChart()`, `updateBadgeUI()` |
| Timer | `triggerManualStart()`, `startCountdown()`, `pauseCountdown()`, `stopCountdown(isFinishedNaturally)`, `renderTimerDisplay()` |
| Schedule | `renderCalendar()`, `handleSaveSchedule()` |
| Profile | `handleSaveProfile()`, `syncCardRealtime()`, `handleAvatarChange()`, `renderAvatarUI()` |
| i18n / theme | `toggleLanguage()`, `applyLanguagePack()`, `toggleTheme()`, `syncThemeUI()` |
| Audio | `toggleStudyMusic()`, `changeMusicVolume()`, `resetMusicPlayerUI()` |
| Suggestions | `generateSmartSuggestion(method, focusLevel, minutesPlanned)` |

## Common workflows

After **any** mutation of `currentUser`, persist with `updateUserInDatabase()` **then** `saveState()` (database first, so the active-user JSON and the DB array stay in sync), and re-render the affected view.

- **Add a UI string:** add the key to `langData.vi` AND `langData.en` → give the element an `id` → add the `getElementById(id).innerText = p.key` line in `applyLanguagePack()`.
- **Add a button/action:** add `onclick="myFn()"` in markup → define top-level `function myFn()` in the script → if it changes data, persist (above) and call the relevant `update*`/`render*`.
- **Add a page/section:** add a `#{name}-section` `.content-section` div (`style="display:none;"`) → optional `#nav-{name}` menu `<li>` with `onclick="navigateTo('{name}')"` → add nav labels to `langData` + `applyLanguagePack()`. `renderSection()` picks it up automatically via the id convention.
- **Add a field to a study log:** capture it in `triggerManualStart()`/`stopCountdown()`, add it to the `newLog` object, and surface it in the history render inside `updateUIAndDashboard()`.
- **Add a profile field:** extend the `profile` object in `handleRegister()` default + `handleSaveProfile()` write + `updateUIAndDashboard()` read/render.

**Manual test pass (no automated tests exist):** serve over HTTP, then for any change verify in **both languages** (`toggleLanguage`) and **both themes** (`toggleTheme`), and in **logged-out and logged-in** states. Sanity-check `localStorage` `track_*` keys in DevTools. To reset, clear `track_*` keys.

## Constraints / guardrails

- **Single-file is intentional.** Keep all style, markup, and logic inline in `index.html`. `main.css`/`main.js` are deliberately empty — do not move code into them, do not add a bundler/framework/package.json, unless a refactor is *explicitly* requested.
- **No build/test/lint step** and no backend. Don't introduce one as a side effect of a small change.
- **CDN-dependent:** Chart.js and Canvas Confetti load from CDNs — the app needs internet, and guard usage (e.g. confetti) is only called where the lib is present. Don't assume offline support.
- **Persist through the helpers** (`updateUserInDatabase()` + `saveState()`); never write `track_currentUser`/`track_userDatabase` ad hoc, or the active user and the DB array drift apart.
- **Bilingual + themed by default:** every user-facing string goes through `langData` (both `vi` and `en`); every color goes through CSS variables/`data-theme`. No hardcoded English-only text or hex colors in new UI.
- **Keep sibling docs in sync** (see Notes) when you change a convention here.

## Notes

- `CLAUDE-VIE.md` is the Vietnamese mirror of this file; `GEMINI.md` / `GEMINI-VIE.md` are sibling AI-instruction files covering the same project. Keep all of them roughly consistent when you change conventions here. This file (`CLAUDE.md`) is the canonical English source.
- `README.md` is written in Vietnamese.

## System Specification (from UML docs — target design)

> The following is the formal spec derived from the project's UML documentation. It describes the **intended/target architecture**, which differs from what's currently shipped (the live app is single-file vanilla JS + `localStorage`, not Flask/MySQL). Use it as the source of truth when building out the backend, DB schema, or refactoring toward client-server.

### Target architecture (Client-Server)
- **Frontend:** SPA — HTML5, **Tailwind CSS**, vanilla ES6 JS, Chart.js.
- **Backend:** Python 3, **Flask**, **SQLAlchemy ORM**, **Flask-Login**.
- **Database:** MySQL (production) / LocalStorage (client simulation & sync).

### Relational schema (ER)
- **User** — `email` (PK, unique), `pass` (hashed), `name`, `streak` (int, default 0)
- **Profile** (1–1 with User) — `user_email` (FK→User.email), `class`, `major`, `goal` (all default `''`), `avatarData` (Base64 image)
- **Log** (1–N with User) — `id` (PK, auto-inc), `user_email` (FK), `subject`, `duration` (actual minutes), `plannedDuration` (planned minutes), `focus` (1–10), `method` (Pomodoro / Deep Work / Active Recall), `note`, `date` (`DD/MM/YYYY`)
- **Schedule** (1–N with User) — `id` (PK, auto-inc), `user_email` (FK), `day` (Thứ 2 → Chủ nhật), `time` (`HH:MM SA/CH`), `subject`

### Domain classes (UML)
- **NguoiDung (User):** id, hoTen, email, matKhau, lopKhoa, nganhHoc, mucTieuDaiHan, anhDaiDien, ngonNgu, cheDoManHinh. Methods: dangKy, dangNhap, dangXuat, capNhatHoSo, thayDoiNgonNgu, chinhCheDoMH.
- **PhienHoc (StudySession):** id, monHoc, thoiGianDinhHoc, mucDoTapTrung, phuongPhap, ghiChu, thoiGianBatDau, thoiGianKetThuc, thoiGianThucHoc. Methods: kichHoat, tamDung, luuVaKetThuc, demGio.
- **LichHoc (Schedule):** id, thu, thoiGianBatDau, monHoc. Methods: lenLich, suaLich, xoaLich.
- **Dashboard:** nguoiDungId, gioHocHomNay, streakNgay, tongSoBuoi. Methods: tinhStreak, tinhGioHocHomNay, layLichTuan, layBieuDo7Ngay.
- **LichSu (History):** id, monHoc, thoiGianThucHoc, phuongPhap, mucDoTapTrung, ghiChu, ngayHoc. Methods: xemLichSu, locTheoMon.
- **ThanhTuu (Achievement):** id, ten, moTa, dieuKien, nguongGio, icon. Methods: kiemTraDieuKien, capHuyHieu.
- **AmNhac (Music):** id, ten, url. Methods: phat, tamDung, dieuChinh.

Relationships: User 1→0..* StudySession; User 1→0..* Schedule; User 1→1 Dashboard; User 1→0..* Achievement; StudySession 0..*→1 Music (plays); StudySession 1→1 History (saves into); Dashboard 1→0..* History (reads).

### Timer / session logic

> The spec below uses `currentSession`/`secondsLeft`/`timerInterval` naming. **As shipped**, the timer is implemented with module-level vars `totalSecondsLeft`, `initialSecondsPlanned`, `countdownInterval`, `isTimerRunning` (there is no `currentSession` object). Use the as-built names below when editing the live code.

- **Start (`triggerManualStart()`):** require `subject` + a positive `duration` (else `alert(langData[currentLang].alert_valid)`); set `totalSecondsLeft = duration*60`, `initialSecondsPlanned = totalSecondsLeft`; swap the form for the timer box, start the lofi audio (autoplay may be blocked → caught), add `body.focus-active`, then `startCountdown()`.
- **Tick (`startCountdown()`):** guard against double-start via `isTimerRunning`; a 1s `setInterval` (`countdownInterval`) decrements `totalSecondsLeft`, re-renders via `renderTimerDisplay()`, and calls `stopCountdown(true)` at 0.
- **Pause (`pauseCountdown()`):** `clearInterval(countdownInterval)`, `isTimerRunning = false`, swap pause→resume buttons. Resume calls `startCountdown()` again.
- **Stop / save (`stopCountdown(isFinishedNaturally=false)`):** actual minutes = `initialSecondsPlanned - totalSecondsLeft` seconds, floored to minutes, **rounded up if remainder ≥ 30s**, and floored to a **minimum of 1 min** if any time elapsed. If minutes `> 0` and a subject is set, `unshift` a new log onto `currentUser.logs`, recompute streak, persist (`updateUserInDatabase()` + `saveState()`), fire confetti **only when `isFinishedNaturally`**, then `navigateTo('dashboard')`.
