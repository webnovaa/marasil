# Security controls and storage

- Tenant data is filtered by tenant_id and checked by policies. This is explicit scoping, not a universal Eloquent global scope.
- API keys authenticate using SHA-256 hashes. An encrypted copy is also retained so authorized device-management screens can redisplay integration keys. General key lists omit secrets. Creation and rotation return the secret; rotation revokes the previous key. Preserve APP_KEY to decrypt retained secrets.
- OTP codes are hashed with a pepper. The fake channel is for local/testing; production uses the platform WhatsApp device. Tests force an isolated fake channel and SQLite in memory.
- Internal requests use HMAC-SHA256, timestamp validation and nonces. Socket.IO tokens scope access to a tenant/device.
- Webhook secrets and message text use Laravel encryption. Webhooks sign deliveries and validate destination URLs against private/reserved addresses; HTTPS is mandatory in production. DNS validation is not network-level egress isolation.
- Media is stored on the configured private disk (local by default). The worker reads it and sends base64 bytes in the signed internal command, with a 16 MiB transport cap. No public upload URL is required.
- Baileys credentials and Signal keys are AES-256-GCM encrypted in the whatsapp_sessions volume at /data/sessions. The device_sessions SQL table is not the credential store.
- Production does not publish PostgreSQL, Redis or WhatsApp service ports. TLS termination must be provided by the deployment's reverse proxy.
- Approvals and sensitive actions are recorded in audit logs.

## Operational requirements

Back up database data, private storage and the encrypted session volume. Keep APP_KEY, SESSION_MASTER_KEY and signing secrets in a separate protected backup. Changing encryption keys without migrating encrypted data makes that data unreadable. There is no automatic key-rotation migration.

Baileys is an unofficial adapter. A healthy service endpoint proves readiness, not that a phone is connected or delivery is guaranteed. Validate a real send with an authorized recipient before production rollout.
