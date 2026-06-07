# StudyTrack

StudyTrack là ứng dụng quản lý việc học cho học sinh, sinh viên — gồm bộ đếm giờ Pomodoro/phiên tập trung, dashboard, lịch học tuần, chuỗi ngày học (streak), huy hiệu thành tích và thẻ sinh viên ảo. Ứng dụng song ngữ Việt/Anh, hỗ trợ giao diện sáng/tối.

Dự án **đang được xây dựng lại (rebuild) thành full-stack** từ bản single-file vanilla JS ban đầu thành một ứng dụng client–server thật: giữ trọn các tính năng thói quen học hiện có và bổ sung lớp **quản lý học vụ** (GPA/CPA, tín chỉ, phân tích chọn môn, cảnh báo môn yếu, lộ trình học theo môn tiên quyết, deadline + nhắc nhở realtime).

> Bản app cũ (single-file `index.html` + `main.*` + `dom.mp3`) đã được chuyển vào thư mục **`legacy/`** và vẫn chạy độc lập được. Xem `legacy/README.md`.

## Kiến trúc tổng quan

Monorepo chia làm ba phần chính:

```
StudyTrack/
  backend/     FastAPI + SQLAlchemy 2.0 + Alembic + Pydantic v2 (nguồn chân lý cho logic học vụ)
  frontend/    React 18 + TypeScript + Vite + Tailwind + shadcn/ui
  deploy/      Docker Compose prod (nginx + backend + db + certbot) + deploy.sh
  docs/        Tài liệu nội bộ (backup, branch-protection, claude-design-workflow)
  legacy/      Bản app single-file cũ (index.html, main.css, main.js, dom.mp3)
  Makefile · docker-compose.yml · .env.example · .pre-commit-config.yaml
  .github/workflows/{ci,deploy}.yml
```

**Stack:**

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 + Alembic (migration), Pydantic v2, PostgreSQL, JWT + argon2 (thay mật khẩu plaintext của bản cũ), WebSocket native, gunicorn + uvicorn. Test: pytest.
- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui (Radix), Recharts, TanStack Query + Zustand, react-router, react-i18next (song ngữ vi/en), react-hook-form + zod. Test: Vitest.
- **Hợp đồng FE↔BE:** FastAPI xuất OpenAPI → `openapi-typescript` sinh type TS cho frontend (`make gen-types`) để FE/BE không lệch schema.
- **Realtime:** WebSocket (qua nginx dùng `wss` ở prod) cho nhắc deadline, cảnh báo môn yếu, mở khóa huy hiệu, đồng bộ dashboard.
- **Deploy:** Docker Compose all-in-one trên VPS riêng (nginx + FastAPI + Postgres + Let's Encrypt), tự động deploy qua GitHub Actions khi merge `main`.

## Cách chạy dev

Yêu cầu: Docker (+ docker compose plugin), Python 3.12+, Node 20+.

```bash
# 1. Tạo file .env từ template rồi điền giá trị
cp .env.example .env

# 2. Bật Postgres cho dev (docker-compose)
make db-up

# 3. Chạy cả backend (uvicorn --reload) và frontend (vite) cùng lúc
make dev
```

`make dev` khởi động backend ở cổng `:8000` và frontend (Vite) song song; Ctrl-C để dừng cả hai. Backend cần cài dependency riêng (`cd backend && pip install -e ".[dev]"`) và frontend cần `cd frontend && npm install` trong lần chạy đầu.

- Health check: `GET http://localhost:8000/api/health` → `{"status": "ok"}`
- OpenAPI: `http://localhost:8000/openapi.json` · Swagger UI: `http://localhost:8000/docs`
- DB browser tùy chọn (Adminer): `docker compose --profile tools up -d` → `http://localhost:8080`

## Xác thực & API (Phase 1)

Phase 1 thêm lớp đăng ký/đăng nhập thật (thay auth plaintext của bản cũ) và nền hồ sơ người dùng:

- **Mật khẩu** băm bằng **argon2**; phiên đăng nhập dùng **JWT access token** (mặc định 24h, ký bằng `JWT_SECRET`).
- **Token lưu ở frontend trong `localStorage`** (khóa `track_token`) và gửi kèm header `Authorization: Bearer <token>`; gặp 401 thì tự xóa token và quay về `/login`.
- **Ngôn ngữ & giao diện** (`lang`/`theme`) lưu trên `User` ở server, nạp lại khi đăng nhập (đồng bộ đa thiết bị); `localStorage` là mặc định khi chưa đăng nhập.

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/auth/register` | Đăng ký `{email, password, name}` → trả `Token` (tự đăng nhập) |
| `POST` | `/api/auth/login` | Đăng nhập **form-urlencoded** (`username`=email, `password`) → `Token` (tương thích nút Authorize của Swagger) |
| `GET` | `/api/auth/me` | Thông tin user + profile hiện tại (cần Bearer) |
| `PATCH` | `/api/auth/me` | Cập nhật `{name?, lang?, theme?}` |
| `GET` / `PUT` | `/api/profile` | Đọc / cập nhật hồ sơ (lớp, khoa, ngành, mục tiêu, avatar base64) |

**Tài khoản demo** (sau khi chạy `make seed`): `demo@studytrack.app` / `studytrack`.

> Ghi chú: avatar lưu dạng **base64 data-URI** trong cột `profiles.avatar_url` (giới hạn ~500KB). Trường lớp trong API tên là `class_name` (vì `class` là từ khóa Python). Bảng `profiles` đã tạo sẵn các cột học vụ (`target_cpa`, `total_credits_required`, `expected_graduation`) nhưng để trống tới Phase 3.

## Thói quen học & API (Phase 2)

Phase 2 port toàn bộ lớp **thói quen học** từ bản single-file cũ sang full-stack: phiên tập trung (focus session), lịch sử, chuỗi ngày học (streak), lịch tuần, dashboard và gợi ý thông minh.

**Hai model mới** (migration `0002_study_sessions_schedule`):

- **`StudySession`** (bảng `study_sessions`) — một phiên học đã ghi nhận (port của `Log` cũ): `user_id` (FK→users, CASCADE), `subject`, `planned_minutes`, `actual_minutes`, `focus` (1–10), `method` (`Pomodoro` / `Deep Work` / `Active Recall`), `note`, `started_at` / `ended_at` (timestamptz, UTC, nullable), `session_date` (DATE — **ngày lịch theo giờ địa phương của client**, là cơ sở tính streak/KPI/biểu đồ), `created_at`. `course_id` là cột nullable **chưa có FK** (FK + UI liên kết môn để Phase 4).
- **`ScheduleItem`** (bảng `schedule_items`) — một mục lịch tuần lặp lại: `user_id` (FK→users, CASCADE), `day_of_week` (int 0–6, **Thứ 2 = 0**), `time` (chuỗi `"HH:MM"` 24h), `subject`, `recurring` (bool, mặc định true), `created_at`. `course_id` nullable, chưa FK (Phase 4).

**Mô hình "đếm giờ phía client, ghi 1 phiên khi dừng":** bộ đếm giờ chạy hoàn toàn ở frontend (Zustand, lưu trạng thái vào `localStorage` khóa `track_timer` để refresh giữa phiên vẫn khôi phục được UI) — **không có tick phía server**. Khi dừng, frontend `POST /api/sessions` đúng **một** bản ghi `StudySession`; `session_date` lấy theo ngày địa phương (`localDateISO()`) để khớp với cách gom nhóm streak/KPI/biểu đồ. Confetti bắn khi phiên kết thúc tự nhiên; nhạc lofi tập trung dùng `dom.mp3`.

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/sessions` | Ghi một phiên học (gọi khi bộ đếm dừng) |
| `GET` | `/api/sessions` | Liệt kê phiên học của user (hỗ trợ `?limit`), mới nhất trước |
| `DELETE` | `/api/sessions/{id}` | Xóa một phiên học |
| `GET` | `/api/schedule` | Liệt kê mục lịch tuần |
| `POST` | `/api/schedule` | Thêm mục lịch |
| `PUT` | `/api/schedule/{id}` | Sửa mục lịch |
| `DELETE` | `/api/schedule/{id}` | Xóa mục lịch |
| `GET` | `/api/dashboard` | KPI (`today_minutes`, `total_minutes`, `total_sessions`, `streak`) + biểu đồ 7 ngày + 3 huy hiệu + 5 phiên gần nhất |
| `POST` | `/api/suggestions` | Gợi ý thông minh có cấu trúc cho form focus (FE render text vi/en) |

Tất cả endpoint Phase 2 đều yêu cầu Bearer auth.

**Các trang frontend mới** (route được bảo vệ): **Focus** (`/focus` — bộ đếm + chọn môn/phút/phương pháp, nhạc lofi), **History** (`/history` — danh sách phiên), **Schedule** (`/schedule` — lưới tuần CRUD đầy đủ), và **Dashboard** thật (KPI + biểu đồ cột 7 ngày bằng **Recharts** thay cho Chart.js + 3 huy hiệu + xem nhanh phiên gần đây).

> Quyết định chính: **huy hiệu được suy ra phía server** (`first_session` ≥1 phiên, `focused_5h` ≥300 phút thực học, `master_20h` ≥1200 phút) — không lưu trong DB. `session_date` do client cung cấp (giờ địa phương), còn dashboard dùng `today = date.today()` của server (chấp nhận sai lệch nhỏ quanh ranh giới ngày). `streak` = số ngày học liên tiếp tính tới ngày học gần nhất, bằng 0 nếu ngày học gần nhất cách hôm nay hơn 1 ngày.

**Dữ liệu demo** (sau `make seed`): tài khoản `demo@studytrack.app` / `studytrack` có sẵn **5 phiên học** + **3 mục lịch tuần** để dashboard/biểu đồ có dữ liệu ngay.

## Học vụ lõi & API (Phase 3)

Phase 3 thêm lớp **quản lý học vụ**: học phần (CTĐT), học kỳ, điểm số, một **engine GPA/CPA có test** (quy đổi hệ 10 → chữ → hệ 4, xếp loại, tiến độ tín chỉ) và **bộ what-if** (tính ngược điểm trung bình cần đạt cho mục tiêu + dự phóng điểm giả định).

**Ba model mới** (migration `0003_courses_semesters_grades`, tất cả FK CASCADE, index `user_id`):

- **`Semester`** (bảng `semesters`) — học kỳ: `code` ("2024-1", sắp xếp được), `name`, `start_date`/`end_date` (nullable). Unique `(user_id, code)`.
- **`Course`** (bảng `courses`) — học phần trong CTĐT: `code`, `name`, `credits` (≥0), `category` (general/foundation/specialized/elective, nullable), `is_required` (mặc định true), `planned_semester_id` (cột tiến tới — chưa dùng ở Phase 3, phục vụ roadmap Phase 4). Unique `(user_id, code)`.
- **`Grade`** (bảng `grades`) — điểm của một học phần trong một học kỳ: `grade_10` (float, nullable), `status` (`in_progress`/`passed`/`failed`/`exempt`). Unique `(user_id, course_id, semester_id)`. **`letter`/`grade_4` không lưu trong DB** — engine tính khi đọc (nguồn chân lý = `grade_10` + thang điểm).

**Engine GPA/CPA** (`backend/app/services/gpa_engine.py`, viết test-first):

- Quy đổi hệ 10 → chữ (A/B+/B/C+/C/D+/D/F) → hệ 4 theo thang VN mặc định (`GradeScale` cấu hình được để mở rộng sau).
- GPA học kỳ + **CPA tích lũy** (trung bình có trọng số theo tín chỉ); **học lại lấy lần gần nhất** (latest-wins theo `semester_code`); môn `failed` tính 0 vào mẫu số, `exempt`/`in_progress` loại khỏi trung bình.
- Tiến độ tín chỉ (đã đạt = passed+exempt, đang học, còn lại) + xếp loại (Xuất sắc ≥3.6 / Giỏi ≥3.2 / Khá ≥2.5 / Trung bình ≥2.0 / Yếu).
- **What-if:** *goal-seek* (điểm trung bình cần đạt trên số tín chỉ còn lại để chạm CPA mục tiêu + tính khả thi + CPA tối đa có thể đạt) và *dự phóng* (nhập điểm giả định → CPA dự phóng).

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` / `POST` / `PUT` / `DELETE` | `/api/semesters`(`/{id}`) | CRUD học kỳ |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/courses`(`/{id}`) | CRUD học phần (CTĐT) |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/grades`(`/{id}`, `?semester_id`) | CRUD điểm; response nhúng `course`/`semester` + `letter`/`grade_4` tính sẵn |
| `GET` | `/api/gpa` | Tổng hợp CPA + xếp loại + tiến độ tín chỉ + GPA từng học kỳ |
| `POST` | `/api/gpa/what-if` | Goal-seek + dự phóng |

Tất cả endpoint Phase 3 đều yêu cầu Bearer auth và chỉ thao tác trên dữ liệu của chính user. `PUT /api/profile` nay nhận thêm `target_cpa` / `total_credits_required` / `expected_graduation` (mục tiêu học bổng dùng cho what-if).

**Các trang frontend mới** (route được bảo vệ): **Courses** (`/courses` — CRUD CTĐT) và **Grades** (`/grades` — quản lý học kỳ, nhập điểm với **xem trước chữ/hệ-4 tức thời** qua `lib/gpa.ts`, bảng tổng hợp GPA/CPA + xếp loại + thanh tiến độ tín chỉ, biểu đồ xu hướng GPA theo học kỳ, panel what-if). Dashboard có thêm **thẻ CPA** nhanh.

> `frontend/src/lib/gpa.ts` là **bản sao client** của engine (chỉ phần quy đổi + xếp loại) để xem trước tức thời; backend vẫn là nguồn chân lý. `gpa.test.ts` (Vitest) khẳng định bản sao khớp engine tại mọi ngưỡng biên.

**Dữ liệu demo** (sau `make seed`): tài khoản demo có thêm **2 học kỳ + 6 học phần + 6 điểm** (gồm một môn học lại, một môn đang học, một môn miễn) để bảng điểm/GPA có dữ liệu ngay; profile đặt `target_cpa=3.6`, `total_credits_required=140`.

## Lệnh thường dùng

Tất cả lệnh chuẩn hóa qua `Makefile` (chạy `make help` để xem danh sách):

| Lệnh | Mô tả |
|------|-------|
| `make dev` | DB dev + backend (uvicorn --reload) + frontend (vite), chạy cùng lúc |
| `make backend` | Chỉ chạy backend (uvicorn --reload) |
| `make frontend` | Chỉ chạy frontend (vite dev server) |
| `make db-up` / `make db-down` | Bật / dừng Postgres dev (giữ named volume) |
| `make test` | Chạy test backend (pytest) + frontend (vitest run) |
| `make lint` | Lint cả hai package (ruff/black --check, eslint/prettier --check) |
| `make pre-commit` | Chạy mọi pre-commit hook trên toàn cây mã |
| `make migrate` | Áp dụng tất cả migration Alembic (`alembic upgrade head`) |
| `make migrate-rev m="message"` | Tự sinh một revision migration mới |
| `make seed` | Nạp dữ liệu demo qua `backend/seed.py` |
| `make gen-types` | Dump OpenAPI (không cần chạy server) và sinh lại `frontend/src/lib/api-types.ts` |
| `make deploy` | Trigger deploy prod cục bộ (CI thường tự chạy khi merge main) |
| `make clean` | Xóa container + volume DB dev (PHÁ HỦY: mất dữ liệu dev) |

## Biến môi trường

Khai báo trong `.env` (copy từ `.env.example`). `.env` bị git-ignore và bị pre-commit chặn — không bao giờ commit secret thật.

| Biến | Mục đích |
|------|----------|
| `POSTGRES_USER` | User Postgres (docker-compose dev) |
| `POSTGRES_PASSWORD` | Mật khẩu Postgres |
| `POSTGRES_DB` | Tên database |
| `POSTGRES_PORT` | Cổng host expose DB dev (mặc định 5432) |
| `DATABASE_URL` | URL SQLAlchemy async (asyncpg) backend dùng kết nối Postgres |
| `JWT_SECRET` | Khóa bí mật ký JWT access token (sinh chuỗi ngẫu nhiên dài) |
| `VITE_API_URL` | Base URL frontend gọi API (dev: backend local; prod: domain qua nginx) |
| `ANTHROPIC_API_KEY` | (Tùy chọn, phase sau) khóa Claude API cho tính năng gợi ý học tập AI |

## Quy trình Git & deploy

- `main` **luôn xanh và deploy được** — không commit thẳng vào `main` (bật branch protection, xem `docs/branch-protection.md`).
- Mỗi đơn vị việc = một **work branch** (`feat/<scope>`, `fix/<scope>`, `chore/<scope>`; ví dụ theo phase: `feat/p0-scaffold`).
- Trên branch: code + test → chạy đủ `make test` + `make lint` local → mở **PR** → CI (`.github/workflows/ci.yml`) chạy `test` (pytest + vitest), `lint` (ruff/black + eslint/prettier), `migrate-check` (alembic upgrade trên Postgres + chặn model drift) phải xanh → **squash-merge vào `main`**.
- Merge `main` → GitHub Actions (`.github/workflows/deploy.yml`) SSH vào VPS chạy `deploy/deploy.sh` (`git pull` → `docker compose -f deploy/docker-compose.prod.yml up -d --build` → `alembic upgrade head`). Secret cần thiết: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
- **Quy ước commit message:** chỉ commit trên `main` mới dùng dạng phiên bản `x.x.x : message`; commit trên các branch dùng message bình thường (Conventional Commits).

## Trạng thái các phase

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| **0** | Scaffold + đường ray workflow: monorepo, docker-compose dev, FastAPI skeleton + `/api/health` + Alembic, Vite+React+Tailwind+shadcn + i18n vi/en + theme, lint/pre-commit, CI/deploy Actions, OpenAPI→TS, seed, Makefile, .env.example, `legacy/` | ✅ Hoàn thành |
| **1** | Auth + nền user: JWT + argon2, User/Profile, i18n + theme, hồ sơ + thẻ SV ảo | ✅ Hoàn thành |
| **2** | Port thói quen học: focus timer + StudySession, history, streak, lịch tuần, dashboard KPI + biểu đồ 7 ngày (Recharts), badges | ✅ Hoàn thành |
| **3** | Học vụ lõi: Course/Semester/Grade, GPA/CPA engine + xếp loại + tiến độ tín chỉ, what-if GPA & học bổng | ✅ Hoàn thành |
| **4** | CTĐT & lộ trình: Prerequisite/CTĐT, roadmap engine, direction analysis, liên kết phiên học↔môn, cảnh báo môn yếu | ⏳ |
| **5** | Deadline + realtime: Deadline/lịch thi, WebSocket notifications/nhắc nhở | ⏳ |
| **6** | Lớp AI: service Claude API (proxy qua backend, giấu key) nâng cấp phân tích điểm yếu / lộ trình / tư vấn chọn môn | ⏳ |

## Ghi chú

- Bản app cũ single-file nằm trong `legacy/` (chạy bằng `python3 -m http.server 8000` rồi mở `legacy/index.html`); xem `legacy/README.md`.
- Dự án được phát triển với sự hỗ trợ của Claude Code. Cấu hình trợ lý AI (file hướng dẫn `CLAUDE.md` và bộ harness `.claude/`) được giữ **cục bộ trên máy dev, không commit lên repo** để GitHub chỉ chứa mã nguồn sản phẩm.
