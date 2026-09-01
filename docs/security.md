# Security notes (v1)

## Controls in place

- Tenant isolation via Policies + `tenant_id` scopes
- API keys hashed (raw shown once)
- OTP hashed with pepper; Fake channel never logs codes
- Internal Laravel↔WhatsApp HMAC + timestamp window
- **Webhooks (Phase 6):**
  - HMAC-SHA256 signatures (`X-Webhook-Id`, `X-Webhook-Timestamp`, `X-Webhook-Signature`)
  - SSRF URL validation: HTTPS required in production; private/loopback/link-local IPs blocked; DNS A/AAAA checked when resolvable
  - Secrets stored encrypted at rest; plaintext shown once on create/rotate
  - Delivery retries: 1m → 5m → 30m → 2h → 12h then `abandoned`
  - Idempotent deliveries on `(webhook_endpoint_id, event_id)`
- Media uploads validated for MIME + size; stored on S3-compatible disk
- Session Baileys material encrypted at rest (AES-256-GCM)
- No Postgres/Redis/WA ports in production compose overlay
- Audit logs for approvals and sensitive admin actions

## Explicit product risks

- Baileys is unofficial WhatsApp Web; bans/breaks possible
- Rate limits do not prevent WhatsApp account restrictions
- Acceptable-use + admin approval required before sending

## Secrets

Never commit `.env`. Rotate `APP_KEY`, `SESSION_MASTER_KEY`, `INTERNAL_HMAC_SECRET`, `OTP_PEPPER`, and webhook signing secrets independently.
