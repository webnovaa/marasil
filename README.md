# Marasil / مراسيل — WhatsApp API SaaS

منصة SaaS لربط أجهزة واتساب عبر QR واستخدام REST API لإرسال إشعارات مشروعة.

A multi-tenant WhatsApp API SaaS (Laravel + Inertia/React + Node/Baileys) run entirely via Docker.

> **تنويه / Disclaimer:** يعتمد محرك الربط على [Baileys](https://github.com/WhiskeySockets/Baileys) (غير رسمي). قد يتوقف أو يؤدي إلى تقييد الأرقام. للاستخدام المشروع مع مستلمين موافقين فقط.

## متطلبات / Requirements

- Docker + Docker Compose
- Make (أو تشغيل أوامر `docker compose` يدويًا)

## البدء السريع / Quick start

```bash
cp .env.example .env
# عدّل كلمات المرور والأسرار في .env / set passwords & secrets
make setup
```

`make setup` ينسخ `.env` إن لم يوجد، يبني الصور، يشغّل الـstack (`--profile dev`)، ينفّذ migrations/seeders، ثم يطبع الروابط.

Copies `.env` if missing, builds images, starts the stack with `--profile dev`, migrates/seeds, and prints URLs.

## روابط التطوير / Dev URLs

| Service        | URL                                      |
|----------------|------------------------------------------|
| App            | http://localhost:8080                    |
| API health     | http://localhost:8080/api/v1/health      |
| Vite HMR       | http://localhost:5173                    |

Mailpit and MinIO are not bundled. Mail uses the log driver; media uses private local storage by default.

## أوامر مفيدة / Useful commands

```bash
make up        # start
make down      # stop
make build     # build images
make logs      # follow logs
make migrate   # run migrations
make seed      # run seeders
make test      # run tests
make lint      # lint / static checks
make health    # hit health endpoints
make backup    # pg_dump → storage/backups
make restore FILE=./storage/backups/....sql.gz
```

## البنية / Layout

```text
apps/platform/          Laravel 13 + Inertia v3 + React
apps/whatsapp-service/  Node.js WhatsApp engine
packages/contracts/     OpenAPI & shared schemas
docker/                 Nginx, PHP, scripts
compose.yaml            Base stack
compose.dev.yaml        Dev port overlays
compose.prod.yaml       Production hardening
```

## أسرار التطوير / Dev secrets

ضع قيمًا فريدة في `.env` (لا ترفعها إلى Git):

```bash
openssl rand -base64 32   # SESSION_MASTER_KEY
openssl rand -base64 32   # INTERNAL_HMAC_SECRET
# APP_KEY يُولَّد عبر: docker compose exec api php artisan key:generate
```
