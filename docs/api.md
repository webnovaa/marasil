# Public & Admin API — هيكل OpenAPI 3.1

> هيكل المرحلة 0. الملف التنفيذي الكامل يُولَّد لاحقًا في `packages/contracts/openapi.yaml` ويُزامَن مع Swagger UI.

## أساسيات

- Base: `/api/v1`
- Admin: `/api/admin/v1`
- Health: `/up`, `/api/v1/health`
- تنسيق النجاح:

```json
{
  "success": true,
  "data": {},
  "meta": { "request_id": "req_01..." }
}
```

- تنسيق الخطأ:

```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_CONNECTED",
    "message": "The selected device is not connected.",
    "details": {}
  },
  "meta": { "request_id": "req_01..." }
}
```

## مصادقة

| السطح | الآلية |
|-------|--------|
| Inertia web | Sanctum session cookie (Secure, HttpOnly, SameSite) |
| Public messaging API | Bearer API key (`mrs_live_…` / `mrs_test_…`) |
| Mobile (جاهزية v1) | Sanctum PAT قصير العمر + refresh rotation |
| Admin API | Session/token + RBAC + 2FA قبل الإنتاج |
| Internal WA ↔ Laravel | HMAC-SHA256 + timestamp + event/command id + version |

## Endpoints — `/api/v1`

### Auth & Me

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | public |
| POST | `/auth/verify-phone` | public |
| POST | `/auth/resend-otp` | public |
| POST | `/auth/login` | public |
| POST | `/auth/refresh` | token |
| POST | `/auth/logout` | session/token |
| POST | `/auth/forgot-password` | public |
| POST | `/auth/reset-password` | public |
| GET | `/me` | user |
| PATCH | `/me/profile` | user |
| PATCH | `/me/password` | user |
| GET | `/me/sessions` | user |
| DELETE | `/me/sessions/{sessionUlid}` | user |

### Plans & Subscriptions

| Method | Path |
|--------|------|
| GET | `/plans` |
| POST | `/subscription-requests` |
| GET | `/subscription-requests` |
| GET | `/subscription` |
| POST | `/subscription/renewal-request` |

### Devices

| Method | Path |
|--------|------|
| GET/POST | `/devices` |
| GET/PATCH/DELETE | `/devices/{deviceUlid}` |
| POST | `/devices/{deviceUlid}/connect` |
| POST | `/devices/{deviceUlid}/disconnect` |
| POST | `/devices/{deviceUlid}/logout` |
| POST | `/devices/{deviceUlid}/test-message` |

### API Keys

| Method | Path | ملاحظة |
|--------|------|--------|
| GET/POST | `/api-keys` | السر يُعاد مرة واحدة عند الإنشاء |
| DELETE | `/api-keys/{keyUlid}` | revoke |
| POST | `/api-keys/{keyUlid}/rotate` | سر جديد مرة واحدة |

### Messages

| Method | Path | ملاحظة |
|--------|------|--------|
| POST | `/messages/text` | API key؛ `202 Accepted` |
| POST | `/messages/media` | API key |
| GET | `/messages` | pagination/filters |
| GET | `/messages/{messageUlid}` | |

مثال إرسال:

```http
POST /api/v1/messages/text
Authorization: Bearer mrs_live_xxx
Idempotency-Key: order-582-confirmation
Content-Type: application/json

{
  "device_id": "01JDEVICEULID",
  "to": "+9639XXXXXXXX",
  "message": "مرحباً، تم تجهيز طلبك رقم 582."
}
```

### Webhooks & Usage & Notifications

| Method | Path |
|--------|------|
| GET/POST | `/webhooks` |
| PATCH/DELETE | `/webhooks/{webhookUlid}` |
| POST | `/webhooks/{webhookUlid}/test` |
| POST | `/webhooks/{webhookUlid}/rotate-secret` |
| GET | `/webhooks/{webhookUlid}/deliveries` |
| GET | `/usage/current` |
| GET | `/usage/history` |
| GET | `/notifications` |
| PATCH | `/notifications/{id}/read` |

## Webhook delivery headers

```text
X-Webhook-Id
X-Webhook-Timestamp
X-Webhook-Signature: sha256=<hmac>
```

Retries: 1m, 5m, 30m, 2h, 12h → abandoned (+ jitter). HTTPS فقط في الإنتاج؛ منع SSRF.

## Admin — `/api/admin/v1` (ملخص)

- Dashboard stats
- User approvals / suspend / reactivate
- Tenants
- Plans CRUD
- Subscription requests approve/reject + extend/suspend
- Payments / invoices
- Devices diagnostics (بدون credentials)
- Message metadata aggregates
- Failed webhooks retry
- Support tickets
- Audit + security events
- System health / workers
- Announcements

كل موافقة/رفض: ملاحظة إدارية + Audit + إشعار.

## أكواد الخطأ الثابتة (حد أدنى)

```text
UNAUTHENTICATED, FORBIDDEN,
ACCOUNT_PENDING_APPROVAL, ACCOUNT_SUSPENDED, PHONE_NOT_VERIFIED,
SUBSCRIPTION_REQUIRED, SUBSCRIPTION_EXPIRED, PLAN_LIMIT_REACHED,
RATE_LIMIT_EXCEEDED, VALIDATION_ERROR,
DEVICE_NOT_FOUND, DEVICE_NOT_CONNECTED, DEVICE_REQUIRES_RELINK, DEVICE_SUSPENDED,
MESSAGE_DUPLICATE, MESSAGE_NOT_FOUND, UNSUPPORTED_MESSAGE_TYPE, MEDIA_TOO_LARGE,
API_KEY_INVALID, API_KEY_REVOKED, API_KEY_EXPIRED, API_KEY_ABILITY_MISSING,
WEBHOOK_URL_UNSAFE, PROVIDER_TEMPORARILY_UNAVAILABLE, INTERNAL_ERROR
```

## Rate limiting (مستويات)

IP · API key · tenant · device · endpoint type · subscription quota

## OpenAPI artifacts (لاحقاً)

- `packages/contracts/openapi.yaml`
- Swagger UI للمستخدم المسجّل أو docs domain
- Postman collection مولّد
- TypeScript types للواجهة من OpenAPI
