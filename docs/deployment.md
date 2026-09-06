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

Use only compose.yaml + compose.prod.yaml with --profile prod. The production image builds frontend assets. Nginx must serve the exact same public/build output as PHP; the supplied Nginx bind mount expects the release's built apps/platform/public directory on the host.

1. Back up PostgreSQL, storage/app/private and the whatsapp_sessions volume, plus encryption keys separately.
2. Set APP_ENV=production, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, and APP_URL to the HTTPS URL. Use OTP_CHANNEL=whatsapp only after connecting the platform device.
3. Supply unique APP_KEY, INTERNAL_HMAC_SECRET, SESSION_MASTER_KEY (base64, 32 bytes), and OTP_PEPPER. Do not change keys for existing encrypted data without a migration plan.
4. Build versioned release images and matching public/build assets. Terminate HTTPS at an external reverse proxy; supplied Nginx listens on port 80.
5. Run migrations once, then start api, horizon, scheduler, nginx and whatsapp-service. Mount persistent private storage shared by PHP services.
6. Check /up, /api/v1/health and WhatsApp /health/ready. Check Horizon and scheduler processes, then open public, tenant and admin pages.
7. Pair or reconnect devices as needed. A process restart does not automatically reconstruct every in-memory Baileys runtime. Test delivery to an authorized recipient.
8. Roll back to the prior image and matching frontend build if checks fail. Do not automatically reverse migrations or remove volumes.

Message and webhook jobs use Redis/Horizon. The scheduler publishes pending outbox messages every minute, reconciles subscriptions hourly and prunes notifications daily. The current webhook implementation permits five total attempts, waiting 1m, 5m, 30m and 2h between attempts.

Media defaults to private local storage. S3 requires the compatible Flysystem adapter and bucket configuration; simply setting AWS variables does not install the adapter. Internal media transport is capped at 16 MiB.
