# Architecture — implemented system

Marasil is a Laravel modular monolith with an Inertia/React frontend and a separate Node/Baileys WhatsApp worker.

## Request flow

Browser → Nginx → Laravel controllers → domain actions/services → PostgreSQL.

External API caller → API key authentication → subscription/device/consent checks → transaction reserving usage and recording message + outbox → Redis/Horizon → signed Node command → Baileys.

Node sends signed status events back to /api/internal/v1/whatsapp/events. QR and realtime device status travel through Nginx /socket.io/ to authenticated tenant/device rooms. Media bytes are loaded from private storage by PHP, then transmitted as base64 inside the signed internal request (maximum 16 MiB).

## Ownership and persistence

- PostgreSQL owns users, tenants, subscriptions, devices, messages, usage and webhook records. Tenant isolation is explicit tenant_id query filtering plus policies.
- Redis supplies sessions, cache, queues and locks; Horizon processes queued jobs.
- Baileys credentials and Signal keys live in encrypted .session files in the whatsapp_sessions volume, not in the device_sessions database table. AES-256-GCM uses SESSION_MASTER_KEY.
- Private media and payment proofs use storage/app/private by default. Production PHP services share platform_private_storage.
- API key authentication uses hashes; encrypted recoverable copies support the authorized device integration screen. General API key lists omit secrets.

## User interfaces

Public marketing pages, authentication pages, tenant workspace and administration use React, Inertia, shared UI components and design tokens. The two dashboard pages use responsive cards, bilingual labels and logical spacing. Tenant activity comes from a tenant-scoped seven-day database aggregation; empty days are explicitly zero-filled.

## Contracts and checks

packages/contracts/openapi.json is the canonical API inventory; docs/openapi.yaml mirrors it. CI verifies registered route coverage. Internal send commands are validated in apps/whatsapp-service/src/message-command.ts, with mock engine and payload tests.

Runtime requires PHP 8.4 for the locked Laravel/test dependencies and Node 22 or newer. Compose uses PostgreSQL 18, Redis 8.2, PHP 8.4 and Node 24. No Octane, Cloud API adapter, automatic multi-worker session restoration or Sentry integration is implemented.

## Scheduled work

outbox:publish runs every minute, subscriptions:reconcile hourly, notifications:prune daily. Backups are manual commands; include database, private storage, session volume and separately protected encryption keys.
