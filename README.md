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
| `make gen-types` | Boot FastAPI, dump OpenAPI, sinh lại `frontend/src/lib/api-types.ts` |
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
| **1** | Auth + nền user: JWT + argon2, User/Profile, i18n + theme, hồ sơ + thẻ SV | ⏳ |
| **2** | Port thói quen học: focus timer + StudySession, history, streak, lịch tuần, dashboard KPI + biểu đồ 7 ngày (Recharts), badges | ⏳ |
| **3** | Học vụ lõi: Course/Semester/Grade, GPA/CPA engine + xếp loại + tiến độ tín chỉ, what-if GPA & học bổng | ⏳ |
| **4** | CTĐT & lộ trình: Prerequisite/CTĐT, roadmap engine, direction analysis, liên kết phiên học↔môn, cảnh báo môn yếu | ⏳ |
| **5** | Deadline + realtime: Deadline/lịch thi, WebSocket notifications/nhắc nhở | ⏳ |
| **6** | Lớp AI: service Claude API (proxy qua backend, giấu key) nâng cấp phân tích điểm yếu / lộ trình / tư vấn chọn môn | ⏳ |

## Ghi chú

- Bản app cũ single-file nằm trong `legacy/` (chạy bằng `python3 -m http.server 8000` rồi mở `legacy/index.html`); xem `legacy/README.md`.
- Tài liệu hướng dẫn cho AI (Claude/Gemini) ở `CLAUDE.md` (nguồn tiếng Anh chuẩn), `CLAUDE-VIE.md`, `GEMINI.md`, `GEMINI-VIE.md`.
