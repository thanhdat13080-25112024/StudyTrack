# Database Backup — VPS

The production Postgres runs in the `db` service of
`deploy/docker-compose.prod.yml` (named volume `studytrack_prod_pgdata`).
Back it up with a nightly `pg_dump` cron job on the VPS.

## One nightly dump (cron)

Edit the deploy user's crontab on the VPS (`crontab -e`) and add:

```cron
# StudyTrack — nightly Postgres dump at 03:17, keep 14 days
17 3 * * * cd /opt/studytrack && docker compose -f deploy/docker-compose.prod.yml exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > /var/backups/studytrack/db-$(date +\%Y\%m\%d).sql.gz 2>> /var/log/studytrack-backup.log && find /var/backups/studytrack -name 'db-*.sql.gz' -mtime +14 -delete
```

Prep once:

```bash
sudo mkdir -p /var/backups/studytrack
sudo chown "$USER" /var/backups/studytrack
```

> `$POSTGRES_USER` / `$POSTGRES_DB` must be readable by cron — either inline the
> literal values, or source the repo `.env` first
> (`set -a; . /opt/studytrack/.env; set +a; ...`). cron does not load `.env`
> automatically.

## Restore

```bash
cd /opt/studytrack
gunzip -c /var/backups/studytrack/db-YYYYMMDD.sql.gz \
  | docker compose -f deploy/docker-compose.prod.yml exec -T db \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

## Notes
- Dumps are git-ignored (`*.sql`, `*.sql.gz`) — never commit them.
- For off-box durability, sync `/var/backups/studytrack` to object storage
  (e.g. `rclone`/`aws s3 cp`) in a second cron line.
- Do **not** run these from CI; backup is a VPS-local concern.
