# StudyTrack — Go-Live Checklist (self-hosted VPS)

Step-by-step to take StudyTrack from "all-green on `main`" to a public deployment.

**Target topology: everything on the VPS, one domain.** A single nginx (TLS
terminator) serves the SPA at `/`, the API at `/api`, and the WebSocket at `/ws`
(wss) — all on the same origin, so the frontend calls a relative `/api` and
connects `wss://<your-domain>/ws` with no `VITE_API_URL` needed.

**Vercel is a throwaway preview only.** The `study-track` project is built with
`VITE_PREVIEW_MODE=true`, so it runs **backend-less** — login is bypassed and the app
serves baked demo fixtures, letting anyone browse every page with sample data. Once
the VPS serves everything, **both Vercel projects are deleted** (`studytrack-mzds`
legacy + `study-track` preview). See §7.

> Nothing here runs automatically. CI keeps `main` deployable; a human provisions
> the VPS and fills secrets once. The `Deploy` workflow then auto-runs on every
> push to `main` (it keeps failing with `missing server host` until §3 is done).

---

## 0. Prerequisites

- A VPS (Ubuntu 22.04+/Debian) with a public IP and root/sudo SSH access.
- A domain for the app, e.g. `studytrack.<you>.dev`, with DNS pointed at the VPS
  IP (an `A`/`AAAA` record).
- `docker` + the `docker compose` plugin installed on the VPS.
- Ports **80** and **443** open in the VPS firewall (certbot http-01 + HTTPS).

---

## 1. Provision the VPS

```bash
# On the VPS, as a sudo user:
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker "$USER"   # re-login so docker works without sudo

sudo mkdir -p /opt/studytrack && sudo chown "$USER" /opt/studytrack
git clone https://github.com/thanhdat13080-25112024/StudyTrack.git /opt/studytrack
cd /opt/studytrack
```

The deploy path defaults to `/opt/studytrack` (override with the repo Variable
`VPS_REPO_PATH`).

---

## 2. Create the server-side `.env` (NOT in git)

At the repo root on the VPS (`/opt/studytrack/.env`). Start from the template and
fill **real** values:

```bash
cp .env.example .env
python3 -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(48))"
```

Required keys for production (the prod compose reads these — see
`deploy/docker-compose.prod.yml`):

| Key | Value | Notes |
|-----|-------|-------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | strong, unique | the db service uses these |
| `DATABASE_URL` | `postgresql+psycopg://<USER>:<PASSWORD>@db:5432/<DB>` | **host = `db`** (compose network), not localhost |
| `JWT_SECRET` | the generated random string | rotating it logs everyone out |
| `CORS_ORIGINS` | `https://<your-domain>` | FE is same-origin so CORS is mostly moot — but during the Vercel preview window (§7) also add `https://study-track-orpin.vercel.app` |
| `FRONTEND_URL` | `https://<your-domain>` | used to build email verify/reset links — set to the real domain |
| `EMAIL_BACKEND` | `smtp` | **required for real email** — default `console` only logs the link |
| `EMAIL_SMTP_HOST` / `EMAIL_SMTP_PORT` | e.g. `smtp.gmail.com` / `587` | your SMTP provider |
| `EMAIL_SMTP_USER` / `EMAIL_SMTP_PASSWORD` | SMTP creds | for Gmail use an App Password |
| `EMAIL_FROM` | `StudyTrack <no-reply@your-domain>` | sender header |
| `EMAIL_SMTP_USE_TLS` | `true` | STARTTLS |

> ⚠️ **Email gotcha:** account verification + password reset only send real mail
> when `EMAIL_BACKEND=smtp` *and* the `EMAIL_SMTP_*` creds are set. Leaving the
> default `console` means links are written to the backend logs only — users never
> receive them.

Verify the compose file resolves with your `.env` (no side effects):

```bash
docker compose -f deploy/docker-compose.prod.yml config >/dev/null && echo OK
```

---

## 3. GitHub repo secrets (enables auto-deploy)

Settings → Secrets and variables → Actions. The `Deploy` workflow needs:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | VPS hostname or IP |
| `VPS_USER` | SSH user (in the `docker` group, owns `/opt/studytrack`) |
| `VPS_SSH_KEY` | a private key (PEM) whose public half is in the VPS `~/.ssh/authorized_keys` |

Optional repo **Variable** `VPS_REPO_PATH` if the checkout isn't `/opt/studytrack`.

Until these exist the `Deploy` workflow fails on every push with `missing server
host` — that's expected and harmless (CI still gates correctness).

---

## 4. Point nginx at your domain

Edit `deploy/nginx/default.conf` and replace the **three** `studytrack.example.com`
placeholders (the `server_name` on :80, the `server_name` on :443, and the two
`ssl_certificate*` paths) with your real domain. Commit on `main` (or set it on the
VPS checkout directly before first deploy).

---

## 5. Bootstrap TLS (one-time certbot issuance)

Certs must exist *before* nginx can start with the `ssl` directives. Bootstrap once
with the webroot challenge, then the `certbot` service in compose auto-renews.

```bash
docker compose -f deploy/docker-compose.prod.yml run --rm --service-ports certbot \
  certonly --webroot -w /var/www/certbot -d <your-domain> \
  --email <you@example.com> --agree-tos --no-eff-email
```

If nginx won't start because certs are missing yet, temporarily comment the :443
server block, `up -d nginx`, issue the cert, then restore it and `up -d`.

---

## 6. First deploy

```bash
cd /opt/studytrack
bash deploy/deploy.sh      # git pull -> compose up -d --build -> alembic upgrade head
```

What happens: the one-shot **`frontend-build`** service runs `npm run build` and
copies the SPA into the `frontend_dist` volume; nginx waits for it
(`service_completed_successfully`) then serves it at `/`. The backend comes up
behind `/api` and `/ws`.

Then seed the demo account:

```bash
docker compose -f deploy/docker-compose.prod.yml exec backend python seed.py
# demo login: demo@studytrack.app / studytrack
```

Smoke-test:
- `https://<your-domain>/` loads the SPA.
- `curl https://<your-domain>/api/health` → 200.
- Login as demo works; the notification WebSocket connects.

---

## 7. Retire Vercel (preview → gone)

Vercel was only a preview while the VPS was being set up. The new React app lives in
the Vercel project **`study-track`** (`study-track-orpin.vercel.app`); the legacy
single-file app is in **`studytrack-mzds`**.

- **Preview build (no backend):** the `study-track` project is built with
  `VITE_PREVIEW_MODE=true` (Vercel → Settings → Environment Variables → add it →
  redeploy). In this mode the app bypasses login and serves baked demo fixtures
  (`frontend/src/lib/previewData.ts`), so visitors browse every page with sample data
  — no backend, no `VITE_API_URL`, no `CORS_ORIGINS` entry needed.
- **At VPS go-live (§6 green): delete both Vercel projects** (`study-track` *and*
  `studytrack-mzds`) from the Vercel dashboard. The VPS build leaves
  `VITE_PREVIEW_MODE` unset, so login + the live backend take over. The VPS domain is
  the only home.

---

## 8. Postgres backups (recommended)

Add a cron `pg_dump` on the VPS (see `docs/backup.md` for the full procedure):

```cron
# daily 03:00 dump, keep 7 days
0 3 * * * docker compose -f /opt/studytrack/deploy/docker-compose.prod.yml exec -T db \
  pg_dump -U <POSTGRES_USER> <POSTGRES_DB> | gzip > /opt/backups/studytrack-$(date +\%F).sql.gz
```

---

## 9. Branch protection (after first green deploy)

Protect `main` (Settings → Branches): require PR + the green CI checks
**`test`**, **`lint`**, **`migrate-check`** before merge, no direct pushes. See
`docs/branch-protection.md`.

---

## Done — definition of "live"

- [ ] `https://<your-domain>/` loads the SPA over HTTPS (valid cert).
- [ ] **Login works** (demo account) directly on the VPS domain.
- [ ] A new signup receives a real verification email (SMTP wired).
- [ ] WebSocket notifications connect (`wss://<your-domain>/ws/notifications`).
- [ ] Both Vercel projects deleted; README "Live" URL points at the VPS domain.

> **Next feature after go-live:** Google OAuth login (agreed). It's a backend
> change (own phase) — brainstorm before building.
