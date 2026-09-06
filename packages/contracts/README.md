# API contracts

`openapi.json` is the canonical OpenAPI 3.1 document. It covers all 71 registered Laravel API operations, including auth, devices, messaging, subscriptions, keys, webhooks and administration. Messaging request bodies are specified; other operations retain controller/middleware references for their detailed payloads.

`docs/openapi.yaml` is a JSON-syntax YAML mirror for existing consumers. Update both together. Run `node script/check-contracts.mjs` from the repository root to check equality. CI additionally pipes Laravel's route inventory into `--routes` to detect missing or stale operations.

The internal send-message validator is `apps/whatsapp-service/src/message-command.ts`, tested by `engine-contract.test.ts`. Device command context and engine interfaces live in `src/engines/types.ts`. Internal calls use HMAC, timestamps and nonces; QR events travel over authenticated Socket.IO and are not persisted in platform event payloads.
