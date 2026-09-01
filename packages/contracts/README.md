# Packages / Contracts

Shared API and event contracts for the WhatsApp API SaaS monorepo.

## Planned contents

- OpenAPI 3.1 specifications for the public REST API (`/api/v1`)
- Internal command/event schemas between Laravel (`apps/platform`) and the WhatsApp service (`apps/whatsapp-service`)
- JSON Schema definitions for webhooks and signed payloads
- Generated TypeScript/PHP types (optional tooling later)

OpenAPI documents will live in this package (for example `openapi/openapi.yaml`) so both the platform and WhatsApp service can validate against a single source of truth.
