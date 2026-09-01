# Deployment (v1 stub)

## Dev

```bash
cp .env.example .env
# set DB_PASSWORD, REDIS_PASSWORD, APP_KEY, secrets
# Windows: powershell -File docker/scripts/setup.ps1
# Unix: make setup
make health
make test
```

URLs: `http://localhost:8080` · `/api/v1/health` · Vite `:5173`

## Queue workers

Webhook deliveries and message sends run on the queue. Ensure at least one worker:

```bash
php artisan queue:work --queue=default
```

Retry schedule for failed webhooks: 1m, 5m, 30m, 2h, 12h, then abandoned.

## Media (local disk)

Default: `FILESYSTEM_DISK=local` and `MEDIA_DISK=local` (private files under `storage/app/private`).

For external object storage in production, set `MEDIA_DISK=s3` and configure `AWS_*` credentials.

## Production outline

1. Use `compose.yaml` + `compose.prod.yaml` (no DB/Redis/WA host ports)
2. Build versioned images (commit SHA), never rely on `latest` alone
3. Run migrations **once** via a deploy job (`php artisan migrate --force`)
4. Health-check `/up` and `/api/v1/health` after roll
5. Keep previous image for rollback
6. Encrypted `pg_dump` to S3-compatible storage (`make backup`)

## Required env

`APP_KEY`, `DB_*`, `REDIS_PASSWORD`, `SESSION_MASTER_KEY`, `INTERNAL_HMAC_SECRET`, `OTP_PEPPER`. Optional for S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, `AWS_ENDPOINT`.
