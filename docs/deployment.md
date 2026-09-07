# Deployment and verification

## Local development

Use Docker Desktop with the Linux engine. Configure the root .env from .env.example, then:

```sh
docker compose -f compose.yaml -f compose.dev.yaml --profile dev up -d --build
docker compose -f compose.yaml -f compose.dev.yaml --profile dev exec -T api php artisan migrate --force
```

Run seeders only for an intentional initial installation; do not reseed an existing customer database. Application: http://localhost:8080. Vite: http://localhost:5173. Mailpit and MinIO are not bundled services.

## Verification before rollout

```sh
docker compose -f compose.yaml -f compose.dev.yaml --profile dev exec -T api php vendor/phpunit/phpunit/phpunit --do-not-cache-result
cd apps/platform
npm ci
npm run typecheck
npm run lint
npm test
npm run build
cd ../whatsapp-service
npm ci
npm run typecheck
npm test
npm run build
```

The test bootstrap applies forced PHPUnit settings to Docker environment variables and bypasses application configuration cache. Tests use SQLite in memory and fake OTP; they do not migrate the deployed PostgreSQL database.

## Production

Use only `compose.yaml` + `compose.prod.yaml` with `--profile prod`. The production image builds frontend assets inside `docker/php/Dockerfile`.

1. Back up PostgreSQL, storage, and the `whatsapp_sessions` volume, plus encryption keys separately.
2. In the **root** `.env` (Compose `env_file` for `api`):
   - `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, HTTPS `APP_URL`
   - Unique `APP_KEY`, `INTERNAL_HMAC_SECRET`, `SESSION_MASTER_KEY`, `OTP_PEPPER`, DB/Redis passwords
   - First boot: `RUN_MIGRATIONS=true`, `RUN_DB_SEED=true`, plus:
     - `SUPER_ADMIN_PHONE=+9639…` (E.164)
     - `SUPER_ADMIN_PASSWORD=` (min 12 chars)
     - optional `SUPER_ADMIN_NAME` / `SUPER_ADMIN_COMPANY`
3. Start stack: `docker compose -f compose.yaml -f compose.prod.yaml --profile prod up --build -d`
   - The **api** php-fpm entrypoint runs migrate/seed when those flags are true (horizon/scheduler never seed).
4. After first successful boot set `RUN_DB_SEED=false` (and usually `RUN_MIGRATIONS=false`), then recreate `api`.
5. Check `/up`, `/api/v1/health`, WhatsApp `/health/ready`, Horizon, and admin/tenant UIs.
6. Pair the platform WhatsApp device before relying on `OTP_CHANNEL=whatsapp`.

Manual alternative without entrypoint flags:

```sh
docker compose -f compose.yaml -f compose.prod.yaml --profile prod exec -T api php artisan migrate --force
docker compose -f compose.yaml -f compose.prod.yaml --profile prod exec -T api php artisan db:seed --force
docker compose -f compose.yaml -f compose.prod.yaml --profile prod exec -T api php artisan optimize:clear
```

Local/dev seeders (`SuperAdminSeeder`, `DemoDataSeeder`) never run when `APP_ENV=production`.


Message and webhook jobs use Redis/Horizon. The scheduler publishes pending outbox messages every minute, reconciles subscriptions hourly and prunes notifications daily. The current webhook implementation permits five total attempts, waiting 1m, 5m, 30m and 2h between attempts.

Media defaults to private local storage. S3 requires the compatible Flysystem adapter and bucket configuration; simply setting AWS variables does not install the adapter. Internal media transport is capped at 16 MiB.
