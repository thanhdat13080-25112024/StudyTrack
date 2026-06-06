# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

StudyTrack is a single-page study-habit manager (Pomodoro timer, dashboard, weekly scheduler, achievement badges, virtual student ID). It is bilingual (Vietnamese/English) with light/dark themes, deployed at https://studytrack-mzds.vercel.app/.

## Running

No build step or package manager — it is vanilla HTML/CSS/JS loading Chart.js and Canvas Confetti from CDNs (requires internet). Serve over HTTP rather than `file://` so `dom.mp3` and assets load:

```bash
python3 -m http.server 8000   # or: npx serve .
```

There is no test or lint setup.

## Architecture

**Everything lives in `index.html`** as a deliberate single-file component — all `<style>`, markup, and `<script>` logic are inline. `main.css` and `main.js` exist but are intentionally empty; do not move code into them unless a refactor is explicitly requested. `dom.mp3` is the lofi focus-session audio.

The app is a set of `content-section` divs swapped via `navigateTo()` (no router). State is held in module-level vars (`isLoggedIn`, `currentUser`) and mirrored to `localStorage` through `saveState()`.

### Persistence — all keys prefixed `track_`
- `track_isLoggedIn` — boolean
- `track_currentUser` — JSON of the active user (study logs, schedule, profile, badges all nested here)
- `track_userDatabase` — array of all registered users; persist changes via `updateUserInDatabase()`
- `track_theme` (`light`/`dark`), `track_lang` (`vi`/`en`)

Authentication is local-only (no backend); registration/login just read/write `track_userDatabase`.

## Conventions to preserve

- **Localization:** all user-facing strings come from the `langData` dictionary. When adding UI text, add both `vi` and `en` entries and rely on `applyLanguagePack()` to render — never hardcode display strings.
- **Theming:** colors are CSS variables under `:root`; switch themes by setting the `data-theme` attribute on `<body>`, not by editing rules.
- **Dashboard/streak/badges** recompute from `currentUser`'s data via `updateUIAndDashboard()`, `updateStreakLogic()`, and `updateBadgeUI()` — update those rather than writing dashboard values directly.

## Notes

- `GEMINI.md` / `GEMINI-VIE.md` are sibling AI-instruction files covering the same project; keep them roughly consistent when you change conventions here.
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
- **Start (`triggerManualStart`):** require `subject`; build in-memory `currentSession` with `secondsLeft = duration * 60` and `startTime = Date.now()`; run a 1s `setInterval` that decrements `secondsLeft` and re-renders, calling `stopCountdown(wasInterrupted=false)` when it hits 0.
- **Pause:** `clearInterval(timerInterval)` and switch UI to `PAUSED`.
- **Stop / save (`stopCountdown`):** compute actual minutes as `((plannedDuration * 60) - secondsLeft) / 60`, rounded. If `> 0`, create a new Log and append it. *(Spec source was truncated past this point.)*
