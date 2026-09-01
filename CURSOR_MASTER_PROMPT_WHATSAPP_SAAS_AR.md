# البرومبت الرئيسي لبناء منصة WhatsApp API SaaS

> انسخ هذا الملف كاملًا إلى Cursor داخل مشروع فارغ. نفّذ العمل على مراحل ولا تتجاوز أي مرحلة قبل تشغيل اختبارات المرحلة الحالية بنجاح.

---

## 1. دورك وطريقة العمل الإلزامية

أنت مهندس برمجيات Principal ومتخصص في Laravel وInertia.js وReact وTypeScript وNode.js وPostgreSQL وRedis وDocker وأمن منصات SaaS متعددة المستأجرين. المطلوب تصميم وتنفيذ منصة SaaS إنتاجية تتيح للمستخدم ربط رقم واتساب كجهاز مرتبط عبر QR، ثم استخدام API خاص بالمنصة لإرسال إشعارات مشروعة إلى عملائه من الجهاز الذي ربطه.

نفّذ النظام بجودة إنتاجية، وليس كنموذج تعليمي سريع. التزم بالقواعد التالية:

1. اقرأ كامل المواصفات قبل إنشاء أي ملف.
2. في البداية أنشئ `docs/implementation-plan.md` و`docs/architecture.md` و`docs/database.md` و`docs/api.md`، ثم انتظر موافقة صاحب المشروع قبل بدء الكود إذا كان يعمل معك تفاعليًا.
3. استخدم آخر إصدار Stable متوافق من التقنيات عند بدء التنفيذ، وثبّت الإصدارات داخل ملفات lock والصور. لا تستخدم إصدارات Alpha أو Beta.
4. لا تستخدم `latest` في صور Docker الإنتاجية.
5. استخدم TypeScript strict mode، وPHP strict types حيث يناسب.
6. لا تضع أسرارًا أو كلمات مرور داخل Git أو Dockerfile أو compose.
7. لا تنفذ إرسال واتساب داخل HTTP request؛ جميع الرسائل تمر عبر Queue.
8. لا تجعل Laravel يحتفظ بجلسات واتساب؛ Baileys يعمل داخل خدمة Node.js مستقلة.
9. لا تفتح PostgreSQL أو Redis أو WhatsApp Service للإنترنت.
10. لا تستخدم Microservices كثيرة. استخدم Laravel Modular Monolith، مع WhatsApp Service مستقلة فقط.
11. كل endpoint يحتاج Validation وAuthorization وRate Limit واختبارات.
12. كل عملية حساسة تحتاج Audit Log.
13. لا تعرض API key أو webhook secret أو session credentials بعد إنشائها إلا مرة واحدة.
14. لا تسجل الأسرار أو OTP أو محتوى الجلسات أو كلمات المرور في Logs.
15. لا تستخدم الحذف النهائي افتراضيًا للبيانات التجارية؛ استخدم Soft Delete عندما يكون منطقيًا.
16. استخدم ULID للمعرفات العامة. لا تعرض integer IDs داخل Public API.
17. حافظ على عزل صارم بين المستأجرين. لا يمكن لمستخدم الوصول إلى جهاز أو رسالة أو مفتاح أو اشتراك تابع لغيره.
18. استخدم معاملات قاعدة البيانات للعمليات المالية والحرجة.
19. نفّذ اختبارات الوحدة والتكامل والميزات والأمان، ولا تكتفِ بكتابة الكود.
20. بعد كل مرحلة: شغّل formatter وlinters وtype checks وtests وDocker health checks، ثم اكتب تقريرًا مختصرًا بما تم.

ملاحظة قانونية وتقنية: Baileys حل غير رسمي يعتمد بروتوكول WhatsApp Web وقد يتوقف أو يؤدي إلى تقييد الأرقام. يجب إظهار ذلك بوضوح في الشروط وواجهة الربط، ومنع السبام واستخدام الخدمة فقط مع مستلمين موافقين. صمّم طبقة WhatsApp Provider abstraction حتى يمكن استبدال Baileys مستقبلًا بـWhatsApp Cloud API دون إعادة بناء قلب المنصة.

---

## 2. الهدف التجاري

المنصة تتيح السيناريو التالي:

1. الزائر ينشئ حسابًا باستخدام رقم واتساب وكلمة مرور.
2. يتحقق من الرقم بواسطة OTP صادر من رقم مركزي خاص بالمنصة.
3. يختار خطة ويرسل طلب اشتراك إلى الإدارة.
4. الأدمن يقبل أو يرفض الحساب وطلب الاشتراك، ويحدد تاريخ البداية والنهاية والحدود المتفق عليها.
5. بعد تفعيل الاشتراك، يضيف المستخدم جهاز واتساب أو أكثر حسب خطته.
6. تمسح جلسة Baileys رمز QR ويظهر الرقم كجهاز مرتبط في واتساب.
7. المستخدم ينشئ API key ويختار صلاحياته.
8. يربط موقعه بـAPI المنصة ويرسل إشعارات نصية أو وسائط من جهاز محدد.
9. المنصة تعيد `message_id` وحالة `queued`، ثم تعالج الرسالة بالخلفية.
10. يمكن لموقع المستخدم الاستعلام عن الحالة أو استقبال Webhook موقّع.
11. المستخدم يدير أجهزته ومفاتيحه واستهلاكه واشتراكه وملفه الشخصي.
12. الأدمن يشاهد ويدير المنصة كاملة من لوحة منفصلة.

---

## 3. التقنيات المعتمدة

استخدم هذه البنية، ولا تغيرها دون شرح وموافقة:

- Backend/API: Laravel، بنمط API-first وREST API وModular Monolith.
- WhatsApp Engine: Node.js + TypeScript + Baileys.
- Web frontend: React + TypeScript + Inertia.js داخل مشروع Laravel نفسه. يمنع إنشاء مشروع Next.js أو frontend repository/container مستقل.
- UI: Tailwind CSS مع مكتبة مكونات ناضجة ومتوافقة مع RTL، مع بناء Design System محلي.
- Database: PostgreSQL.
- Queue/Cache/Locks: Redis.
- Laravel Queue monitoring: Horizon.
- Realtime QR/device status: Socket.IO في WhatsApp Service، مع token قصير العمر يصدره Laravel.
- Reverse proxy: Nginx.
- Containers: Docker + Docker Compose.
- Object storage: واجهة S3-compatible؛ MinIO للتطوير، وS3-compatible في الإنتاج.
- Testing: Pest أو PHPUnit في Laravel، Vitest للـNode، وPlaywright للـE2E.
- API documentation: OpenAPI 3.1 مع Swagger UI، وملف Postman Collection مولّد أو متزامن.
- Observability: Structured JSON logs، Sentry-ready، metrics endpoints، request IDs.

لا تستخدم Laravel Octane في الإصدار الأول. جهّز التطبيق ليقبل إضافته مستقبلًا، لكن استخدم PHP-FPM + Nginx في البداية.

### قرار معماري إلزامي: Inertia داخل Laravel مع API-first

جميع ملفات الواجهة توجد داخل تطبيق Laravel في `resources/js`، ويتم تجميعها بواسطة Vite. تستخدم لوحة الويب Inertia.js للتنقل وReact لبناء الصفحات والمكونات، ويقدم Laravel الـInertia shell والصفحات.

مع ذلك يجب تصميم جميع وظائف النظام الأساسية كـPublic/Internal REST APIs مستقلة وقابلة للاستخدام من تطبيق موبايل مستقبلي. اتبع القواعد التالية:

1. لا تضع منطق أعمال داخل Inertia controllers أو React pages.
2. ضع المنطق في Actions/Services/Application layer مشتركة.
3. أنشئ API controllers وAPI Resources لكل capability يحتاجها تطبيق الموبايل مستقبلًا.
4. واجهة Inertia تستخدم `/api/v1` لجلب البيانات وتنفيذ العمليات الديناميكية عبر client موحد مبني على Axios أو Fetch، باستثناء تسليم الصفحة والـshared props الأساسية.
5. يمكن استخدام Inertia form actions في حالات الويب الخاصة فقط، لكن يجب أن تستدعي نفس Action/DTO/Policy المستخدمة في API وألا تكون الوظيفة متاحة حصريًا عبر Web route.
6. مصادقة الويب تستخدم Laravel Sanctum session cookies الآمنة، بينما يكون التصميم جاهزًا لإضافة Personal Access Tokens أو OAuth للتطبيق دون تغيير منطق الأعمال.
7. استخدم Form Requests وAPI Resources واستجابات موحدة. لا تجعل React تعتمد مباشرة على أشكال Eloquent Models.
8. لا تنشئ نسخة مكررة من business logic بين `routes/web.php` و`routes/api.php`.
9. عند بناء تطبيق الموبايل مستقبلًا، يجب أن يستطيع استهلاك `/api/v1` دون الاعتماد على Inertia أو HTML.
10. ملفات React وCSS وVite تبنى في multi-stage Docker build ثم تنسخ assets النهائية إلى صورة Laravel الإنتاجية.

---

## 4. بنية المستودع

أنشئ Monorepo بالشكل التالي:

```text
whatsapp-saas/
├── apps/
│   ├── platform/                  # Laravel + Inertia + React + Public API
│   │   ├── app/
│   │   ├── resources/
│   │   │   ├── js/
│   │   │   │   ├── Components/
│   │   │   │   ├── Layouts/
│   │   │   │   ├── Pages/
│   │   │   │   ├── Features/
│   │   │   │   ├── Hooks/
│   │   │   │   ├── Lib/
│   │   │   │   ├── Types/
│   │   │   │   └── app.tsx
│   │   │   └── css/
│   │   ├── routes/
│   │   │   ├── web.php            # Inertia page shells فقط
│   │   │   └── api.php            # REST API v1 للموقع والموبايل
│   │   ├── Dockerfile
│   │   ├── composer.json
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── whatsapp-service/          # Node.js + TypeScript + Baileys
├── packages/
│   ├── contracts/                 # JSON schemas/event contracts/shared types
│   └── eslint-config/             # optional shared React/node config
├── docker/
│   ├── nginx/
│   ├── php/
│   ├── postgres/
│   └── scripts/
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── security.md
│   ├── deployment.md
│   ├── backup-restore.md
│   └── runbooks/
├── compose.yaml
├── compose.dev.yaml
├── compose.prod.yaml
├── .env.example
├── Makefile
└── README.md
```

داخل Laravel نظّم المنطق إلى Domains/Modules:

```text
app/Domain/
├── Identity
├── Administration
├── Tenancy
├── Plans
├── Subscriptions
├── Billing
├── Devices
├── ApiKeys
├── Messaging
├── Webhooks
├── Usage
├── Support
├── Notifications
└── Audit
```

كل Domain يحتوي حسب الحاجة على Actions وDTOs وEnums وModels وPolicies وServices وEvents وListeners وJobs وQueries. لا تضع منطق الأعمال الثقيل داخل Controllers أو Models.

---

## 5. Docker والتشغيل

يجب أن يعمل المشروع كاملًا عبر Docker، دون تثبيت PHP أو Node أو PostgreSQL محليًا.

الخدمات المطلوبة:

```text
nginx
api
horizon
scheduler
whatsapp-service
postgres
redis
minio (development profile)
mailpit (development profile)
vite (development profile فقط، لتشغيل HMR من ملفات Laravel resources/js)
```

المتطلبات:

1. استخدم multi-stage Docker builds.
2. شغّل العمليات بغير root حيثما أمكن.
3. أضف healthcheck لكل خدمة طويلة التشغيل. Vite التطويري لا يدخل نشر الإنتاج.
4. استخدم `restart: unless-stopped` في الإنتاج.
5. أنشئ شبكتي `public` و`internal`؛ Nginx فقط يتصل بالعام.
6. لا تنشر منافذ PostgreSQL وRedis وWhatsApp Service في ملف الإنتاج.
7. استخدم volumes دائمة للقاعدة وRedis وMinIO والنسخ الاحتياطية، ولا تعتمد على filesystem المؤقت لحفظ جلسات واتساب.
8. لا تشغل migrations من كل replica. أنشئ أمر deploy منفصلًا لتشغيلها مرة واحدة.
9. أضف أوامر Makefile مثل:

```text
make setup
make up
make down
make build
make test
make lint
make logs
make migrate
make seed
make health
make backup
make restore
```

10. `make setup` ينسخ `.env.example` عند غيابه، يبني الصور، يولد مفاتيح التطوير، يشغل الخدمات، ينفذ migrations وseeders، ثم يطبع الروابط.
11. أضف graceful shutdown للـNode workers حتى لا تتلف الجلسات أو تضيع المهام.
12. أنشئ backup container أو script يقوم بـ`pg_dump` مشفر ويرفع النسخة إلى S3-compatible storage، مع توثيق الاستعادة واختبارها.
13. في الإنتاج، ابنِ React/Inertia assets داخل Node build stage ثم انسخ `public/build` إلى صورة Laravel/Nginx؛ لا تشغل Node frontend server في الإنتاج.

Health endpoints:

- Laravel: `/up` و`/api/v1/health`.
- WhatsApp service internal: `/health/live` و`/health/ready`.
- واجهة Inertia لا تحتاج health service منفصلة؛ تتحقق صحتها من Laravel `/up` ومن وجود Vite manifest/assets.
- PostgreSQL: `pg_isready`.
- Redis: authenticated `PING`.

---

## 6. Multi-tenancy والأدوار

اعتمد shared database/shared schema مع `tenant_id` في جميع البيانات التابعة للعميل. لا تعتمد subdomain tenancy في الإصدار الأول.

الأدوار:

- `super_admin`: كامل النظام.
- `admin`: إدارة المستخدمين والطلبات وفق صلاحيات محددة.
- `support_agent`: دعم ومشاهدة تشخيصية محدودة دون أسرار.
- `tenant_owner`: مالك حساب العميل.
- `tenant_member`: عضو ضمن الحساب بصلاحيات مستقبلية.

استخدم RBAC بصلاحيات دقيقة، مثل:

```text
users.view, users.approve, users.suspend
plans.manage
subscriptions.view, subscriptions.approve, subscriptions.extend, subscriptions.suspend
devices.view, devices.suspend, devices.diagnose
messages.view_metadata
billing.manage
support.manage
audit.view
settings.manage
```

يجب أن تعمل Policies وtenant scopes من الخادم؛ إخفاء زر في الواجهة ليس Authorization.

أنشئ `tenants` حتى لو كان لكل مستخدم شركة واحدة حاليًا، لتسهيل إضافة فرق عمل مستقبلًا.

---

## 7. مخطط قاعدة البيانات

استخدم PostgreSQL وULID كـpublic identifiers، مع timestamps بتوقيت UTC. أضف foreign keys وunique constraints وindexes وcheck constraints. أنشئ migrations منفصلة وواضحة.

### 7.1 الهوية والمستأجرون

#### users

- `id` bigint internal primary key
- `ulid` char(26) unique public id
- `phone_e164` varchar(20) unique
- `phone_verified_at` timestamptz nullable
- `password` varchar
- `status` enum: `pending_phone_verification`, `pending_approval`, `active`, `rejected`, `suspended`, `disabled`
- `preferred_locale` varchar default `ar`
- `timezone` varchar default `UTC`
- `last_login_at` timestamptz nullable
- `last_login_ip` inet nullable
- `approved_at`, `approved_by`, `rejected_at`, `rejected_by` nullable
- `rejection_reason` text nullable
- `remember_token` nullable
- timestamps + soft deletes

#### user_profiles

- `user_id` unique FK
- `full_name`
- `email` nullable unique
- `company_name` nullable
- `avatar_path` nullable
- `country_code` nullable
- `metadata` jsonb default `{}`

#### tenants

- `id`, `ulid`
- `name`
- `slug` unique
- `owner_user_id`
- `status`: `active`, `suspended`, `closed`
- timestamps + soft deletes

#### tenant_members

- `tenant_id`, `user_id`
- `role`
- `status`: `invited`, `active`, `suspended`
- unique `(tenant_id,user_id)`

#### phone_verifications

- `id`, `user_id` nullable
- `phone_e164`
- `purpose`: `registration`, `login_challenge`, `password_reset`, `phone_change`
- `code_hash`
- `attempts`
- `max_attempts`
- `expires_at`
- `consumed_at` nullable
- `requested_ip` inet
- timestamps

#### auth_sessions

- `id`, `ulid`, `user_id`
- `token_family_id`
- `device_name`, `user_agent`, `ip_address`
- `last_used_at`, `expires_at`, `revoked_at`
- timestamps

#### security_events

- `id`, `ulid`, `user_id` nullable, `tenant_id` nullable
- `type`, `severity`
- `ip_address`, `user_agent`
- `context` jsonb مع بيانات منقحة
- timestamps

### 7.2 الخطط والاشتراكات والفوترة

#### plans

- `id`, `ulid`, `name`, `slug`
- `description`
- `price_minor` bigint
- `currency` char(3)
- `duration_days` integer nullable
- `max_devices`
- `monthly_message_limit`
- `daily_message_limit_per_device`
- `max_api_keys`
- `max_webhooks`
- `max_media_size_mb`
- `allow_media`, `allow_priority_queue`, `allow_team_members`
- `features` jsonb
- `is_public`, `is_active`, `sort_order`
- timestamps + soft deletes

#### subscription_requests

- `id`, `ulid`, `tenant_id`, `plan_id`, `requested_by`
- `type`: `new`, `renewal`, `upgrade`, `downgrade`
- `status`: `pending`, `approved`, `rejected`, `cancelled`
- `payment_method` nullable
- `payment_reference` nullable
- `payment_proof_path` nullable
- `customer_note` nullable
- `admin_note` nullable
- `reviewed_by`, `reviewed_at`, `rejection_reason` nullable
- timestamps

#### subscriptions

- `id`, `ulid`, `tenant_id`, `plan_id`
- `status`: `scheduled`, `active`, `expiring`, `expired`, `suspended`, `cancelled`
- `starts_at`, `ends_at`, `grace_ends_at` nullable
- snapshot columns لكل حدود الخطة حتى لا تتغير الاشتراكات القديمة عند تعديل الخطة
- `approved_by`
- `suspended_at`, `suspension_reason` nullable
- `auto_renew` default false
- timestamps

اسمح باشتراك نشط واحد فقط لكل tenant باستخدام partial unique index حيث يناسب.

#### subscription_events

- `id`, `subscription_id`, `actor_user_id` nullable
- `event_type`
- `from_status`, `to_status`
- `details` jsonb
- timestamps

#### payments

- `id`, `ulid`, `tenant_id`, `subscription_request_id` nullable
- `amount_minor`, `currency`
- `provider`, `provider_reference`
- `status`: `pending`, `paid`, `failed`, `refunded`, `cancelled`
- `paid_at`, `failed_at` nullable
- `metadata` jsonb
- timestamps

#### invoices

- `id`, `ulid`, `tenant_id`, `subscription_id`
- `invoice_number` unique
- `subtotal_minor`, `tax_minor`, `total_minor`, `currency`
- `status`: `draft`, `issued`, `paid`, `void`
- `issued_at`, `due_at`, `paid_at`
- `pdf_path` nullable
- timestamps

### 7.3 الأجهزة والجلسات

#### devices

- `id`, `ulid`, `tenant_id`
- `name`
- `phone_e164` nullable حتى اكتمال الربط
- `provider` default `baileys`
- `status`: `creating`, `qr_required`, `connecting`, `connected`, `disconnected`, `logged_out`, `suspended`, `error`, `deleted`
- `worker_id` nullable
- `session_version` integer default 1
- `last_connected_at`, `last_disconnected_at`, `last_heartbeat_at`
- `disconnect_reason`, `last_error_code`, `last_error_message` nullable ومُنقحة
- `daily_limit_override` nullable
- `settings` jsonb
- timestamps + soft deletes
- index `(tenant_id,status)` وunique مناسب للرقم الفعال داخل tenant

#### device_sessions

- `id`, `device_id` unique
- `encrypted_data` bytea أو text
- `encrypted_data_key`
- `encryption_key_version`
- `nonce`, `auth_tag`
- `credentials_version`
- `rotated_at`
- timestamps

لا تخزن session credentials غير مشفرة. استخدم AES-256-GCM مع envelope encryption، والمفتاح الرئيسي خارج قاعدة البيانات.

#### device_events

- `id`, `ulid`, `device_id`, `tenant_id`
- `event_type`
- `from_status`, `to_status`
- `reason_code`
- `metadata` jsonb منقح
- timestamps

### 7.4 مفاتيح API

#### api_keys

- `id`, `ulid`, `tenant_id`
- `name`
- `prefix` للعرض والتعرف
- `secret_hash` ولا يخزن السر الخام
- `environment`: `test`, `live`
- `abilities` jsonb أو relation مستقلة
- `last_used_at`, `last_used_ip`
- `expires_at` nullable
- `revoked_at`, `revoked_by`, `revocation_reason` nullable
- timestamps

المفتاح الخام يظهر مرة واحدة عند الإنشاء. استخدم prefix عشوائيًا مثل `wsa_live_` ولا تستخدم encrypted reversible storage للمفتاح إذا لم تكن هناك حاجة لاستعادته.

### 7.5 الرسائل والاستهلاك

#### messages

- `id`, `ulid`, `tenant_id`, `device_id`, `api_key_id` nullable
- `idempotency_key` nullable
- `recipient_e164`
- `type`: `text`, `image`, `document`, `audio`, `video`, `location`, `contact`
- `content_encrypted` nullable أو سياسة retention واضحة
- `media_path` nullable
- `caption` nullable
- `status`: `queued`, `processing`, `sent`, `delivered`, `read`, `failed`, `cancelled`, `expired`
- `provider_message_id` nullable
- `priority` smallint
- `scheduled_at` nullable
- `queued_at`, `processing_at`, `sent_at`, `delivered_at`, `read_at`, `failed_at`
- `error_code`, `error_message` nullable
- `request_id`
- timestamps
- unique `(tenant_id,idempotency_key)` عندما لا تكون null
- indexes `(tenant_id,created_at)`, `(device_id,status)`, `(status,scheduled_at)`

#### message_attempts

- `id`, `message_id`, `attempt_number`
- `worker_id`
- `started_at`, `finished_at`
- `status`: `started`, `succeeded`, `failed`, `retry_scheduled`
- `error_code`, `error_class`, `error_message`
- `next_retry_at`
- timestamps

#### message_status_events

- `id`, `message_id`
- `status`
- `provider_timestamp` nullable
- `metadata` jsonb منقح
- timestamps

#### usage_counters

- `id`, `tenant_id`, `device_id` nullable
- `period_type`: `day`, `month`
- `period_start`
- `messages_accepted`, `messages_sent`, `messages_failed`
- `media_bytes`
- unique keys بحسب period/tenant/device

استخدم atomic Redis counters للسرعة، مع reconciliation job يعيد مطابقتها مع PostgreSQL.

### 7.6 Webhooks

#### webhook_endpoints

- `id`, `ulid`, `tenant_id`
- `name`, `url`
- `secret_hash` و`secret_encrypted` فقط إذا احتاج النظام السر الخام للتوقيع؛ خزنه بتشفير قابل للدوران
- `subscribed_events` jsonb
- `status`: `active`, `disabled`, `failing`
- `last_success_at`, `last_failure_at`, `failure_count`
- timestamps + soft deletes

#### webhook_deliveries

- `id`, `ulid`, `tenant_id`, `webhook_endpoint_id`
- `event_id`, `event_type`
- `payload` jsonb منقح
- `status`: `pending`, `delivering`, `delivered`, `failed`, `abandoned`
- `attempt_count`, `next_attempt_at`
- `response_status`, `response_excerpt`
- `duration_ms`, `delivered_at`
- timestamps

### 7.7 الإدارة والدعم

#### notifications

- إشعارات داخلية للمستخدم والأدمن مع read timestamp وtype وdata.

#### support_tickets وsupport_messages

- تذكرة مرتبطة بالمستأجر، أولوية، حالة، مسؤول، ورسائل ومرفقات آمنة.

#### audit_logs

- `id`, `ulid`
- `actor_user_id` nullable
- `tenant_id` nullable
- `action`
- `subject_type`, `subject_ulid`
- `before` jsonb منقح
- `after` jsonb منقح
- `ip_address`, `user_agent`, `request_id`
- immutable from application UI
- timestamps

#### system_settings

- مفاتيح إعدادات غير سرية مع schema validation. الأسرار لا توضع هنا.

أنشئ ERD باستخدام Mermaid داخل `docs/database.md`، مع شرح قرارات الفهرسة والـretention.

---

## 8. المصادقة والأمان

### التسجيل

1. إدخال الاسم ورقم واتساب E.164 وكلمة المرور والموافقة على الشروط.
2. Rate limit حسب IP والرقم.
3. إرسال OTP عبر interface باسم `OtpChannel`; نفّذ Development fake provider وواجهة production provider قابلة لربط WhatsApp Cloud API.
4. OTP صالح 5 دقائق، مخزن كـhash، بعدد محاولات محدود، ويستهلك مرة واحدة.
5. بعد التحقق يصبح الحساب `pending_approval`.
6. بعد موافقة الأدمن يصبح `active`، لكن إرسال الرسائل يحتاج اشتراكًا فعالًا.

### تسجيل الدخول

- رقم واتساب + كلمة مرور.
- Password hashing باستخدام Argon2id.
- واجهة Inertia same-origin تستخدم Laravel Sanctum مع session cookies من نوع Secure وHttpOnly وSameSite المناسبة.
- جهّز Mobile API authentication باستراتيجية موثقة (Sanctum tokens في الإصدار الأول أو OAuth2 عند الحاجة) دون مشاركة session cookie مع تطبيق الموبايل.
- عند استخدام mobile tokens: access token قصير العمر وآلية rotation/revocation موثقة، ولا تخزن token خامًا في قاعدة البيانات.
- إبطال token family عند اكتشاف إعادة استخدام refresh token.
- Challenge إضافي بواسطة OTP عند جهاز أو IP عالي الخطورة.
- 2FA إلزامي لحسابات الإدارة قبل الإنتاج.

### استعادة الحساب

- رد موحد لا يكشف هل الرقم مسجل.
- OTP قصير العمر.
- بعد إعادة التعيين: إبطال جلسات الدخول القديمة، تسجيل Security Event، وإشعار المستخدم.

### حماية البيانات

- TLS لكل الاتصالات الخارجية.
- AES-256-GCM لبيانات جلسات Baileys والأسرار القابلة للاسترجاع.
- Envelope encryption مع key versioning وrotation plan.
- API keys وOTP وكلمات المرور تخزن كـhash.
- Webhook signature باستخدام HMAC-SHA256 مع timestamp وحماية replay.
- CORS allowlist، CSP، CSRF protection عند استخدام cookies.
- Validation لأرقام الهاتف والملفات وMIME والحجم.
- منع SSRF في webhook URLs: HTTPS فقط في الإنتاج، منع private/loopback/link-local IPs، وإعادة التحقق بعد DNS resolution والredirects.
- Rate limits للمصادقة والـAPI والإرسال والـwebhooks.
- Audit logs لكل الموافقات والتغييرات الأمنية والاشتراكات وتعليق الأجهزة.
- لا تعرض session credentials في API أو Admin UI.

أنشئ `docs/threat-model.md` يشرح المخاطر: tenant escape، stolen API key، webhook SSRF، replay، QR hijacking، session theft، queue duplication، abuse/spam، admin compromise، backup leakage.

---

## 9. منطق الاشتراكات

لا يستطيع المستخدم إنشاء جهاز أو إرسال رسالة دون اشتراك فعال أو فترة سماح تسمح بذلك.

عند موافقة الأدمن على طلب الاشتراك:

1. استخدم DB transaction.
2. أنشئ subscription snapshot بحدود الخطة.
3. حدّد `starts_at`, `ends_at`, `grace_ends_at`.
4. أنشئ SubscriptionEvent وAuditLog وNotification.
5. إذا كان الاشتراك مجدولًا، يفعّله Scheduler في موعده.

قبل الانتهاء أرسل إشعارات عند 7 و3 و1 يوم. عند الانتهاء:

- أوقف قبول رسائل API الجديدة بكود واضح.
- لا تحذف الأجهزة أو الجلسات فورًا.
- أبقِ لوحة الحساب متاحة للتجديد والتصدير.
- بعد retention policy يمكن تنظيف البيانات وفق سياسة موثقة.

عند خفض الخطة وكان عدد الأجهزة أكبر من الحد، لا تحذف شيئًا تلقائيًا؛ اطلب من المستخدم اختيار الأجهزة التي ستبقى فعالة أو عطّل الزائد وفق قاعدة موثقة.

---

## 10. WhatsApp Service

أنشئ خدمة Node.js TypeScript strict مستقلة. استخدم Provider interface:

```ts
interface MessagingProvider {
  createSession(deviceId: string): Promise<void>;
  disconnectSession(deviceId: string): Promise<void>;
  logoutSession(deviceId: string): Promise<void>;
  restoreSession(deviceId: string): Promise<void>;
  sendMessage(command: SendMessageCommand): Promise<SendMessageResult>;
  getHealth(deviceId: string): Promise<DeviceHealth>;
}
```

نفّذ `BaileysProvider` خلف هذه الواجهة.

المتطلبات:

- لا تستخدم `useMultiFileAuthState` كحل إنتاجي نهائي إن كان غير مناسب للتوسع؛ أنشئ persistence adapter آمنًا يرسل credentials مشفرة إلى Laravel internal API أو storage service موثوق.
- افصل QR data عن session credentials.
- QR قصير العمر، لا يخزن في logs، ويرسل فقط إلى مستخدم مصادق يملك الجهاز باستخدام realtime token قصير العمر ومقيّد بـdevice ID.
- حدّث credentials عند event المطلوب بشكل atomic.
- reconnect مع exponential backoff وjitter.
- لا تعاود الاتصال بعد explicit logout قبل طلب المستخدم.
- heartbeat لكل جلسة.
- graceful shutdown: توقف قبول الرسائل، أكمل المهام الآمنة، احفظ credentials، أغلق sockets.
- وزّع الجلسات مستقبلًا حسب `worker_id` باستخدام distributed lock لمنع تشغيل نفس الجهاز على عاملين.
- عرّف error taxonomy مستقرة بدل تمرير أخطاء Baileys الخام إلى Public API.
- احذف أو نقّح بيانات الرسالة من logs.
- نفّذ adapters وهمية للاختبارات حتى لا تتصل الاختبارات بواتساب الحقيقي.

الأحداث الداخلية الموقعة بين Node وLaravel:

```text
device.qr.updated
device.connecting
device.connected
device.disconnected
device.logged_out
device.credentials.updated
message.sent
message.delivered
message.read
message.failed
service.heartbeat
```

استخدم contract version في كل command/event. تحقق من HMAC وtimestamp وevent id، واجعل معالجة الأحداث idempotent.

---

## 11. Public API v1

Base path:

```text
/api/v1
```

تنسيق النجاح:

```json
{
  "success": true,
  "data": {},
  "meta": { "request_id": "req_..." }
}
```

تنسيق الخطأ:

```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_CONNECTED",
    "message": "The selected device is not connected.",
    "details": {}
  },
  "meta": { "request_id": "req_..." }
}
```

Endpoints الأساسية:

```text
POST   /auth/register
POST   /auth/verify-phone
POST   /auth/resend-otp
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /me
PATCH  /me/profile
PATCH  /me/password
GET    /me/sessions
DELETE /me/sessions/{sessionUlid}

GET    /plans
POST   /subscription-requests
GET    /subscription-requests
GET    /subscription
POST   /subscription/renewal-request

GET    /devices
POST   /devices
GET    /devices/{deviceUlid}
PATCH  /devices/{deviceUlid}
POST   /devices/{deviceUlid}/connect
POST   /devices/{deviceUlid}/disconnect
POST   /devices/{deviceUlid}/logout
DELETE /devices/{deviceUlid}
POST   /devices/{deviceUlid}/test-message

GET    /api-keys
POST   /api-keys
DELETE /api-keys/{keyUlid}
POST   /api-keys/{keyUlid}/rotate

POST   /messages/text
POST   /messages/media
GET    /messages/{messageUlid}
GET    /messages

GET    /webhooks
POST   /webhooks
PATCH  /webhooks/{webhookUlid}
DELETE /webhooks/{webhookUlid}
POST   /webhooks/{webhookUlid}/test
POST   /webhooks/{webhookUlid}/rotate-secret
GET    /webhooks/{webhookUlid}/deliveries

GET    /usage/current
GET    /usage/history
GET    /notifications
PATCH  /notifications/{id}/read
```

Public message sending يستخدم Bearer API key وليس جلسة لوحة التحكم. مثال:

```http
POST /api/v1/messages/text
Authorization: Bearer wsa_live_xxx
Idempotency-Key: order-582-confirmation
Content-Type: application/json
```

```json
{
  "device_id": "01JDEVICEULID",
  "to": "+9639XXXXXXXX",
  "message": "مرحباً، تم تجهيز طلبك رقم 582."
}
```

الاستجابة `202 Accepted` مع `queued`. تحقق من ملكية الجهاز وحالته والاشتراك والحدود والـability قبل Queueing.

Webhook headers:

```text
X-Webhook-Id
X-Webhook-Timestamp
X-Webhook-Signature: sha256=...
```

نفّذ retries بجدول مثل 1m, 5m, 30m, 2h, 12h ثم abandoned، مع jitter، ومنع redirects الخطرة.

أنشئ OpenAPI كاملًا يتضمن schemas والأمثلة وأكواد الأخطاء وrate limit headers، واجعل Swagger UI متاحًا للمستخدم المسجل أو على domain docs منفصل.

---

## 12. Admin API

أنشئ namespace واضحًا `/api/admin/v1` مع حماية RBAC و2FA. يشمل:

- Dashboard statistics.
- Pending user approvals.
- Approve/reject/suspend/reactivate user.
- Tenants listing and detail.
- Plans CRUD مع version-aware validation.
- Subscription requests approve/reject.
- Extend/suspend/cancel subscription.
- Payments/invoices management.
- Devices status and diagnostics دون كشف credentials.
- Suspend/reactivate device.
- Message metadata and aggregate statistics؛ لا تعرض المحتوى الحساس افتراضيًا.
- Failed webhook monitoring and retry.
- Support tickets.
- Audit and security events.
- System health and workers.
- Platform announcements.

كل قرار موافقة أو رفض يحتاج modal تأكيد، ملاحظة إدارية، Audit Log وإشعار للمستخدم.

---

## 13. تخطيط الواجهة وتجربة الاستخدام

الواجهة عربية RTL افتراضيًا مع جاهزية English/LTR. التصميم Light، فاخر، نظيف، سريع، ومتجاوب. جميع الصفحات والمكونات موجودة في `apps/platform/resources/js` وتعمل عبر React + Inertia.js + Vite داخل Laravel. لا تستخدم مظهر Dashboard تقليدي مزدحم أو Dark افتراضيًا.

### تنظيم React داخل Laravel

استخدم تنظيمًا feature-based، وليس مجلدًا ضخمًا من المكونات غير المرتبطة:

```text
resources/js/
├── Components/           # مكونات UI عامة فقط
├── Layouts/              # Guest, Tenant, Admin, Docs
├── Pages/                # Inertia page entry points
│   ├── Auth/
│   ├── Tenant/
│   ├── Admin/
│   └── Public/
├── Features/             # Devices, Messages, Subscriptions, Webhooks...
├── Hooks/
├── Lib/
│   ├── api-client.ts
│   ├── errors.ts
│   ├── permissions.ts
│   └── realtime.ts
├── Types/                # generated/shared API types
├── i18n/
└── app.tsx
```

- Inertia مسؤول عن page navigation/layout/shared auth props.
- `api-client.ts` مسؤول عن طلبات `/api/v1`، request IDs، CSRF، errors، وإلغاء الطلبات.
- لا تستخدم server-side Eloquent payloads كبيرة كـInertia props؛ shared props صغيرة مثل user summary وlocale وpermissions وflash فقط.
- استخدم API pagination وfilters لكل الجداول الثقيلة.
- ولّد TypeScript types من OpenAPI حيث يمكن، حتى يتشارك الويب وتطبيق الموبايل المستقبلي نفس العقود.

### Design system

- خلفية رمادية فاتحة جدًا، بطاقات بيضاء، لون أساسي أخضر/زمردي مرتبط بالمراسلة دون نسخ هوية WhatsApp.
- ألوان حالات موحدة: success أخضر، warning كهرماني، danger أحمر، info أزرق، neutral رمادي.
- خط عربي واضح مثل Tajawal أو IBM Plex Sans Arabic مع fallback مناسب.
- radius متوسط، shadows خفيفة، مسافات واسعة، جداول قابلة للقراءة.
- Sidebar قابلة للطي، Topbar، breadcrumbs، command/search لاحقًا.
- Skeleton loading، empty states، error states، confirmation dialogs، toasts.
- WCAG AA: contrast، keyboard navigation، focus states، labels، aria attributes.
- جميع التواريخ تعرض حسب timezone المستخدم مع حفظ UTC.

### الصفحات العامة

1. Landing page:
   - Hero واضح.
   - كيف تعمل المنصة في 3 خطوات.
   - المزايا.
   - الخطط.
   - الأسئلة الشائعة.
   - تحذير أن ربط WhatsApp Web غير رسمي ضمن الشروط المناسبة.
   - CTA للتسجيل.
2. Login برقم واتساب وكلمة المرور.
3. Registration multi-step.
4. OTP verification.
5. Forgot/reset password.
6. Terms, privacy, acceptable use, status page link.

### Onboarding المستخدم

Progress stepper:

```text
توثيق الرقم → انتظار موافقة الحساب → اختيار الخطة → انتظار الموافقة → ربط أول جهاز → إنشاء API Key → إرسال تجربة
```

اعرض الحالة الحالية بوضوح ولا تسمح بالدخول إلى خطوة غير متاحة.

### لوحة المستخدم

Sidebar:

```text
الرئيسية
الأجهزة
الرسائل
إرسال تجريبي
مفاتيح API
Webhooks
الاستهلاك
الاشتراك والفواتير
التوثيق
الدعم الفني
الإشعارات
الملف الشخصي
الأمان
```

#### Dashboard

- بطاقة حالة الاشتراك والأيام المتبقية.
- استهلاك الرسائل الشهري progress bar.
- الأجهزة المتصلة/المفصولة.
- الرسائل الناجحة والفاشلة.
- رسم 7/30 يومًا.
- آخر الرسائل دون كشف زائد للمحتوى.
- تنبيهات الأجهزة واشتراك منتهي قريبًا.
- Quick actions: إضافة جهاز، إنشاء مفتاح، إرسال تجربة.

#### Devices list

- Cards أو table: الاسم، الرقم، الحالة، آخر اتصال، رسائل اليوم، actions.
- Filters حسب الحالة.
- زر إضافة جهاز مع quota indicator.

#### Device details

- Status hero.
- QR modal آمن مع countdown وتجديد تلقائي.
- تعليمات واتساب خطوة بخطوة.
- Connection timeline.
- Usage and recent failures.
- Rename، reconnect، disconnect، logout، delete.
- العمليات الخطرة تطلب كلمة المرور أو challenge.

#### Messages

- جدول server-side pagination.
- filters: date, device, status, type, recipient.
- message detail drawer: timeline ومحاولات الإرسال وrequest id.
- export CSV كـbackground job ضمن حدود.

#### API Keys

- الاسم، prefix، البيئة، abilities، آخر استخدام، انتهاء الصلاحية.
- إنشاء مفتاح وإظهاره مرة واحدة مع زر نسخ وتحذير.
- revoke/rotate confirmation.

#### Webhooks

- endpoint URL، events، status، failure rate.
- test delivery.
- secret يظهر مرة واحدة.
- deliveries table مع response excerpt منقح.
- code samples للتحقق من HMAC.

#### Subscription

- الخطة الحالية والحدود والبداية والنهاية.
- مقارنة الخطط.
- طلب تجديد/ترقية.
- تاريخ الطلبات والفواتير وإثبات الدفع.

#### Profile/Security

- البيانات الشخصية.
- تغيير رقم الدخول بعملية تحقق مزدوجة.
- تغيير كلمة المرور.
- الجلسات النشطة وإلغاؤها.
- 2FA.
- Security event history.

### لوحة الأدمن

استخدم Layout منفصلًا أو واضح التمييز، ويتضمن:

```text
نظرة عامة
طلبات الحسابات
المستخدمون والشركات
طلبات الاشتراك
الاشتراكات
الخطط
المدفوعات والفواتير
الأجهزة
الرسائل والإحصائيات
Webhooks الفاشلة
الدعم
الإعلانات
سجلات التدقيق
الأحداث الأمنية
صحة النظام
الإعدادات
```

Admin dashboard يعرض pending queues، active tenants، connected devices، message throughput، failure rate، queue lag، workers health، expiring subscriptions، security alerts.

استخدم charts فقط عندما تضيف معنى. كل جدول يحتاج search وfilters وsorting وpagination وempty/error/loading states.

---

## 14. التوثيق المقدم للعملاء

أنشئ Documentation portal داخل الواجهة أو كتطبيق docs لاحقًا. المحتوى المطلوب:

- Introduction and concepts.
- Quick start.
- ربط أول جهاز.
- إنشاء API key.
- Authentication.
- تنسيق E.164.
- إرسال نص وصورة وملف.
- Idempotency.
- Message lifecycle.
- Webhooks والتحقق من التوقيع.
- Rate limits.
- Error reference.
- SDK/code examples: cURL, PHP/Laravel, Node.js, Python.
- Postman collection.
- Changelog and API versioning.
- Security best practices.
- FAQ/troubleshooting.

يجب أن تكون الأمثلة قابلة للنسخ، ولا تحتوي أسرارًا حقيقية.

---

## 15. Queues والمهام المجدولة

Queues المقترحة:

```text
critical
whatsapp-high
whatsapp-default
webhooks
notifications
reports
maintenance
```

المتطلبات:

- Horizon supervisors منفصلة حسب queue.
- timeout أقل من `retry_after` لتجنب التنفيذ المزدوج.
- عدد محاولات محدود وbackoff واضح.
- idempotent jobs.
- distributed lock لكل device عند إرسال متسلسل إذا تطلب provider ذلك.
- dead-letter/failed job workflow مع admin visibility.
- scheduler لحالات الاشتراكات والتنبيهات والتنظيف وusage reconciliation والنسخ الاحتياطية.
- لا تستخدم unlimited retries.

API rate limiting على مستويات:

- IP.
- API key.
- tenant.
- device.
- endpoint type.
- subscription quota.

لا تدّعِ أن rate limiting يمنع حظر واتساب. طبّق acceptable-use controls وإيقافًا تلقائيًا عند ارتفاع معدل الأخطاء.

---

## 16. حالات الخطأ العامة

عرّف error codes ثابتة على الأقل:

```text
UNAUTHENTICATED
FORBIDDEN
ACCOUNT_PENDING_APPROVAL
ACCOUNT_SUSPENDED
PHONE_NOT_VERIFIED
SUBSCRIPTION_REQUIRED
SUBSCRIPTION_EXPIRED
PLAN_LIMIT_REACHED
RATE_LIMIT_EXCEEDED
VALIDATION_ERROR
DEVICE_NOT_FOUND
DEVICE_NOT_CONNECTED
DEVICE_REQUIRES_RELINK
DEVICE_SUSPENDED
MESSAGE_DUPLICATE
MESSAGE_NOT_FOUND
UNSUPPORTED_MESSAGE_TYPE
MEDIA_TOO_LARGE
API_KEY_INVALID
API_KEY_REVOKED
API_KEY_EXPIRED
API_KEY_ABILITY_MISSING
WEBHOOK_URL_UNSAFE
PROVIDER_TEMPORARILY_UNAVAILABLE
INTERNAL_ERROR
```

لا تمرر stack traces أو أخطاء Baileys/PostgreSQL الخام إلى العميل.

---

## 17. الاختبارات وشروط القبول

### Backend

- registration, OTP expiry/attempts/replay.
- login, refresh rotation, logout, password reset.
- admin approval/rejection authorization.
- subscription lifecycle and boundary dates.
- tenant isolation لكل resource.
- device quota and ownership.
- API key create/use/revoke/rotate.
- message idempotency and quota race conditions.
- webhook signature/retry/SSRF protection.
- audit logs.
- queue retry and duplicate event handling.

### WhatsApp Service

- provider mocked lifecycle.
- QR authorization and expiry.
- credential update persistence.
- reconnect backoff.
- explicit logout handling.
- duplicate worker lock.
- message command idempotency.
- graceful shutdown.
- internal signature verification.

### Inertia/React/E2E

- registration to pending approval.
- admin approves account and subscription.
- user links mocked device.
- creates API key and sees secret once.
- sends test message and sees status update.
- expired subscription blocks sending.
- RTL layout at mobile/tablet/desktop.
- accessibility smoke tests.

### Docker acceptance

على جهاز نظيف:

```bash
cp .env.example .env
make setup
make test
make health
```

يجب أن تعمل الأوامر بنجاح، وأن تبقى البيانات بعد `docker compose down` ثم `up`. اختبر استعادة PostgreSQL من backup في بيئة منفصلة.

ضع حد تغطية منطقي للمنطق الحرج، ولا تطارد نسبة شكلية على حساب جودة السيناريوهات.

---

## 18. CI/CD

أنشئ pipeline يشمل:

1. Secret scanning.
2. Dependency install من lockfiles.
3. PHP formatter/static analysis/tests.
4. React/Inertia وNode lint/typecheck/tests.
5. OpenAPI validation.
6. Docker image builds.
7. Container vulnerability scan.
8. Integration tests باستخدام services معزولة.
9. بناء صور versioned بالـcommit SHA والإصدار.
10. Deploy يدوي إلى staging ثم production بعد الموافقة.

الإطلاق:

- backup قبل migration مؤثرة.
- migrations backward-compatible قدر الإمكان.
- health verification بعد النشر.
- rollback موثق للصورة السابقة.
- لا تستخدم mutable production tags فقط.

---

## 19. Seeders وبيانات التطوير

أنشئ development seeders فقط:

- Super admin من env دون كلمة مرور ثابتة في Git.
- خطط Free Trial, Basic, Business, Professional بقيم قابلة للتعديل.
- Tenant تجريبي ومستخدم تجريبي.
- Mock devices/messages عندما `APP_ENV=local` فقط.

يمنع تشغيل بيانات demo تلقائيًا في production.

---

## 20. مراحل التنفيذ الإلزامية

نفّذ بالتسلسل التالي، واعرض تقريرًا واختبارات بعد كل مرحلة:

### المرحلة 0: التصميم

- تثبيت القرارات التقنية.
- Architecture diagrams.
- ERD.
- OpenAPI skeleton.
- Threat model.
- Implementation plan.

### المرحلة 1: البنية وDocker

- Monorepo.
- Docker development stack.
- Laravel + Inertia + React/Vite skeleton وخدمة Node skeleton.
- PostgreSQL/Redis/MinIO/Mailpit.
- Health checks وMakefile.

### المرحلة 2: الهوية والإدارة

- users/tenants/RBAC.
- phone OTP abstraction.
- login/reset/sessions.
- admin approval flow.
- audit/security events.
- واجهات Auth وAdmin approvals.

### المرحلة 3: الخطط والاشتراكات

- plans/requests/subscriptions/payments proof.
- admin approval and date controls.
- quotas and middleware.
- صفحات الخطط والاشتراك والفواتير.

### المرحلة 4: الأجهزة وWhatsApp abstraction

- devices lifecycle.
- internal authenticated contract.
- mocked provider أولًا.
- QR realtime flow.
- encrypted session storage.
- Baileys adapter بعد نجاح الاختبارات الوهمية.

### المرحلة 5: Public API والرسائل

- API keys/abilities.
- text sending.
- queues/idempotency/rate limits.
- message logs/status.
- user documentation quick start.

### المرحلة 6: Webhooks والوسائط

- signed webhooks/retries/SSRF controls.
- S3 media uploads.
- image/document messages.
- delivery monitoring.

### المرحلة 7: اكتمال الواجهات

- dashboards.
- usage/charts.
- profile/security.
- support/notifications.
- admin operations/system health.
- responsive/RTL/accessibility polish.

### المرحلة 8: الإنتاج

- production Docker images.
- backup/restore.
- monitoring/error reporting.
- security review.
- load tests لواجهة API والQueues باستخدام provider mock فقط.
- deployment and rollback runbooks.

لا تبدأ المرحلة التالية إذا كانت اختبارات الحالية فاشلة. لا تترك `TODO` أمنيًا أو دالة وهمية في مسار الإنتاج دون توثيق وحظر واضح.

---

## 21. Definition of Done

يعتبر الإصدار الأول مكتملًا فقط عندما:

1. يستطيع المستخدم التسجيل والتحقق والانتظار حتى موافقة الأدمن.
2. يستطيع الأدمن قبول أو رفض الحساب وطلب الخطة وتحديد مدة الاشتراك.
3. تُطبّق حدود الخطة على الخادم بشكل آمن.
4. يستطيع المستخدم إضافة جهاز وربطه عبر QR واستعادة الجلسة بعد restart.
5. تبقى session credentials مشفرة ولا تظهر في logs/API.
6. يستطيع المستخدم إنشاء API key مرة واحدة وإلغاؤه وتدويره.
7. يستطيع موقع خارجي إرسال رسالة عبر Public API والحصول على `202 queued`.
8. تمنع idempotency الرسائل المكررة.
9. تحدث حالة الرسالة وتصل Webhooks موقعة مع retries.
10. توجد لوحتا مستخدم وأدمن كاملتان، RTL ومتجاوبتان.
11. توجد Documentation وOpenAPI وPostman وأمثلة برمجية.
12. تعمل المنصة بالكامل عبر Docker على جهاز نظيف.
13. تنجح الاختبارات وlinters وtype checks وhealth checks.
14. توجد نسخة احتياطية قابلة للاستعادة فعليًا.
15. توجد شروط استخدام تمنع السبام وتوضح أن Baileys غير رسمي.
16. لا توجد أسرار في Git ولا منافذ داخلية مفتوحة للعامة.

---

## 22. المطلوب منك الآن عند استلام هذا البرومبت

لا تبدأ بكتابة المنصة كلها دفعة واحدة. قم بالآتي فقط كأول رد/مرحلة:

1. لخّص فهمك للمنصة والحدود.
2. اذكر افتراضاتك والأسئلة التي تمنع التنفيذ فقط، دون أسئلة شكلية.
3. اقترح الإصدارات Stable الدقيقة التي ستثبتها.
4. أنشئ خطة تنفيذ تفصيلية قابلة للتأشير.
5. أنشئ مخطط Architecture وERD أولي.
6. اقترح شجرة الملفات النهائية.
7. حدد مخاطر Baileys وخطة العزل والاستبدال.
8. انتظر الموافقة على المرحلة 0 قبل توليد كامل الكود.

بعد الموافقة، ابدأ المرحلة 1 فقط، واجعل المشروع قابلًا للتشغيل والاختبار قبل الانتقال إلى المرحلة 2.

---

## 23. متطلبات جودة الردود أثناء العمل

في نهاية كل دفعة عمل اكتب:

```text
تم تنفيذه:
- ...

الملفات المهمة:
- ...

التحقق الذي تم:
- command → result

القرارات أو المخاطر:
- ...

الخطوة التالية المقترحة:
- ...
```

إذا فشل أمر، لا تدّعِ النجاح. اشرح السبب، أصلحه ضمن نطاق المرحلة، ثم أعد الاختبار. لا تحذف بيانات أو volumes أو migrations قائمة دون طلب صريح. حافظ على migrations تراكمية، وعلى توافق Public API ضمن الإصدار `v1`.
