# خطة التنفيذ — WhatsApp API SaaS

> المرحلة 0 (تصميم). لا يبدأ الكود التنفيذي قبل موافقة صاحب المشروع.

## فهم المنتج (ملخص)

منصة SaaS متعددة المستأجرين تتيح للعميل:

1. التسجيل برقم واتساب + كلمة مرور، والتحقق بـ OTP.
2. انتظار موافقة الأدمن واختيار خطة واشتراك يدوي.
3. ربط جهاز واتساب واحد أو أكثر عبر QR (Baileys / WhatsApp Web غير رسمي).
4. إنشاء API keys وإرسال إشعارات مشروعة عبر Public REST API.
5. متابعة الحالة عبر الاستعلام أو Webhooks موقعة.

**الحدود الصارمة:**

- Laravel Modular Monolith + Inertia/React داخل نفس المشروع؛ لا Next.js مستقل.
- WhatsApp Service (Node) خدمة مستقلة وحيدة؛ لا microservices كثيرة.
- لا إرسال واتساب داخل HTTP request؛ كل الرسائل عبر Queue.
- لا جلسات واتساب داخل Laravel؛ Baileys في Node فقط.
- PostgreSQL / Redis / WhatsApp Service غير معرّضة للإنترنت.
- عزل مستأجرين صارم؛ ULID للمعرفات العامة؛ Audit لكل عملية حساسة.
- طبقة `MessagingProvider` لتمكين استبدال Baileys لاحقًا بـ Cloud API.

---

## افتراضات التنفيذ

| # | الافتراض |
|---|----------|
| A1 | لغة الواجهة الافتراضية عربية RTL، مع جاهزية English/LTR من اليوم الأول. |
| A2 | الدفع يدوي (إثبات دفع + موافقة أدمن) في v1؛ لا بوابة دفع آلية. |
| A3 | Tenant واحد لكل مستخدم مالك في البداية؛ جدول `tenants` + `tenant_members` جاهز للفرق لاحقًا. |
| A4 | OTP في التطوير عبر Fake channel (log)؛ الإنتاج عبر واجهة `OtpChannel` قابلة لربط WhatsApp Cloud API. |
| A5 | مصادقة الويب: Sanctum session cookies؛ مصادقة الموبايل لاحقًا عبر Sanctum Personal Access Tokens في v1. |
| A6 | تخزين جلسات Baileys مشفّر (AES-256-GCM envelope) عبر Internal API لـ Laravel، وليس multi-file auth على disk فقط. |
| A7 | تخزين محلي (`local` disk) في التطوير؛ S3-compatible اختياري في الإنتاج. |
| A8 | منطقة نشر أولية: خادم Linux واحد عبر Docker Compose؛ لا Kubernetes في v1. |
| A9 | العملة الافتراضية للخطط: USD أو عملة يحددها المالك في الموافقة (انظر الأسئلة). |
| A10 | محتوى الرسائل: سياسة retention قابلة للضبط؛ افتراضيًا تخزين محدود/مشفّر أو metadata فقط حسب الإعداد. |

---

## أسئلة مانعة فقط (تحتاج إجابة قبل/أثناء المرحلة 1–2)

1. **العملة الافتراضية** للخطط والأسعار المعروضة؟ (`USD` / `SAR` / `SYP` / أخرى)
2. **قناة OTP الإنتاجية**: هل يوجد حساب WhatsApp Cloud API جاهز للرقم المركزي، أم نؤجل الربط الحقيقي ونبقي الواجهة + Fake حتى مرحلة لاحقة؟
3. **النطاقات**: هل سيكون `app.example.com` للوحة و`api.example.com` للـAPI، أم نفس النطاق مع مسارات؟
4. **سياسة محتوى الرسائل**: هل نخزّن نص الرسالة (مشفّرًا) أم metadata + حالة فقط افتراضيًا؟

أي تفاصيل تصميمية غير مانعة تُحسم داخل docs أثناء التنفيذ.

---

## الإصدارات Stable المقترحة للتثبيت

تُثبَّت في lockfiles وصور Docker (بدون `latest` في الإنتاج):

| المكوّن | الإصدار المقترح | ملاحظات |
|---------|------------------|---------|
| PHP | 8.4.x | متطلب Laravel 13 |
| Laravel | 13.x (^13.29) | Stable حالي |
| Laravel Sanctum | ^4.x | session + tokens |
| Laravel Horizon | ^5.x | مراقبة Queues |
| Inertia Laravel | ^3.0 | متوافق L13 |
| @inertiajs/react | ^3.0 | يتطلب React 19 |
| React / React DOM | ^19.2 | Stable |
| TypeScript | ^5.8 | strict |
| Vite | ^7 أو ^8 حسب توافق laravel-vite-plugin | يُثبَّت عند scaffolding |
| Tailwind CSS | ^4.x | مع RTL |
| Node.js | 24.x LTS (Krypton) | لـ WhatsApp Service وVite |
| PostgreSQL | 18.6 | صورة مثبّتة الرقم |
| Redis | 8.2 أو 8.10 (يُفضَّل 8.2 إن أردنا استقرارًا أطول في OSS) | يُقرَّر عند compose |
| Nginx | 1.28.x (stable alpine) | reverse proxy |
| Baileys | آخر stable على npm وقت المرحلة 4 | خلف Provider abstraction |
| Pest | ^3 أو ^4 حسب توافق L13 | اختبارات PHP |
| Vitest | ^3.x | اختبارات Node |
| Playwright | ^1.x | E2E |
| Socket.IO | ^4.x | QR/status realtime |
| OpenAPI | 3.1 | docs + codegen types |

**قرار Redis:** الافتراضي المقترح `redis:8.2.x-alpine` (دعم أطول) ما لم تُوافق على 8.10.

---

## المراحل (قابلة للتأشير)

### المرحلة 0 — التصميم ✅ (الحالية)

- [x] تثبيت القرارات التقنية
- [x] `docs/architecture.md`
- [x] `docs/database.md` + ERD
- [x] `docs/api.md` (هيكل OpenAPI)
- [x] `docs/threat-model.md`
- [x] `docs/implementation-plan.md`
- [x] **موافقة صاحب المشروع** (2026-08-27 — المتابعة خطوة بخطوة حتى اكتمال المتطلبات)

### قرارات افتراضية بعد الموافقة (قابلة للتعديل لاحقًا)

| السؤال | القرار المعتمد |
|--------|----------------|
| العملة | `USD` (قابلة للتغيير عبر plans/settings) |
| OTP الإنتاجي | واجهة `OtpChannel` + Fake/log الآن؛ ربط Cloud API لاحقًا دون تغيير المسار |
| النطاقات | نفس المضيف مع مسارات (`/` لوحة، `/api/v1` API)؛ Nginx جاهز لفصل نطاقات لاحقًا |
| محتوى الرسائل | metadata + حالة افتراضيًا؛ نص اختياري مشفّر حسب إعداد retention |

### المرحلة 1 — البنية وDocker

- [ ] هيكل Monorepo (`apps/platform`, `apps/whatsapp-service`, `packages`, `docker`)
- [ ] `compose.yaml` + `compose.dev.yaml` + شبكات public/internal
- [ ] Laravel + Inertia + React/Vite skeleton
- [ ] WhatsApp Service skeleton (health + graceful shutdown)
- [ ] PostgreSQL / Redis / Vite HMR (تخزين محلي — لا MinIO/Mailpit)
- [ ] Health checks + Makefile (`setup`, `up`, `test`, `health`, …)
- [ ] `.env.example` بدون أسرار
- [ ] اختبار: `make setup` و`make health` على جهاز نظيف

### المرحلة 2 — الهوية والإدارة

- [ ] Migrations: users, profiles, tenants, members, OTP, sessions, security_events, audit
- [ ] RBAC + Policies
- [ ] OTP abstraction (Fake + production interface)
- [ ] Register / verify / login / reset / sessions
- [ ] Admin approve/reject users
- [ ] واجهات Auth + Admin approvals (Inertia)
- [ ] اختبارات: OTP replay/expiry، عزل، موافقات

### المرحلة 3 — الخطط والاشتراكات

- [ ] plans, subscription_requests, subscriptions, payments, invoices
- [ ] موافقة الأدمن + snapshot حدود الخطة
- [ ] Middleware الحصص والاشتراك الفعّال
- [ ] صفحات الخطط / الاشتراك / إثبات الدفع
- [ ] Scheduler: تفعيل مجدول، تنبيهات 7/3/1، انتهاء
- [ ] اختبارات lifecycle وحدود التواريخ

### المرحلة 4 — الأجهزة وWhatsApp abstraction

- [ ] devices / device_sessions / device_events
- [ ] Internal HMAC contract Laravel ↔ Node
- [ ] Mocked provider + اختبارات كاملة
- [ ] QR realtime (Socket.IO + short-lived token)
- [ ] تخزين جلسات مشفّر
- [ ] Baileys adapter بعد نجاح الـmock
- [ ] اختبارات reconnect / logout / lock

### المرحلة 5 — Public API والرسائل

- [ ] API keys (hash، عرض مرة واحدة، rotate/revoke)
- [ ] `POST /messages/text` → 202 queued
- [ ] Queues / Horizon / idempotency / rate limits
- [ ] message logs + status
- [ ] Quick-start docs داخل الواجهة
- [ ] اختبارات race على الحصص وidempotency

### المرحلة 6 — Webhooks والوسائط

- [ ] webhook endpoints + deliveries
- [ ] HMAC signature + retries + SSRF controls
- [ ] رفع وسائط S3
- [ ] رسائل image/document
- [ ] مراقبة التسليم

### المرحلة 7 — اكتمال الواجهات

- [ ] Tenant dashboard + charts + usage
- [ ] Profile / security / 2FA admin
- [ ] Support + notifications
- [ ] Admin operations + system health
- [ ] RTL / responsive / a11y polish
- [ ] Playwright E2E للمسار الرئيسي

### المرحلة 8 — الإنتاج

- [ ] صور إنتاج multi-stage مثبّتة
- [ ] backup/restore مختبر
- [ ] Sentry-ready + metrics
- [ ] مراجعة أمنية
- [ ] load tests (mock provider فقط)
- [ ] runbooks نشر/تراجع

---

## ترتيب الملفات النهائي المقترح

انظر أيضًا القسم المقابل في الرد؛ الجذر:

```text
whatsapp-saas/
├── apps/platform/                 # Laravel + Inertia + React
├── apps/whatsapp-service/         # Node + Baileys
├── packages/contracts/
├── packages/eslint-config/
├── docker/
├── docs/
├── compose.yaml
├── compose.dev.yaml
├── compose.prod.yaml
├── .env.example
├── Makefile
└── README.md
```

---

## مخاطر Baileys وخطة العزل/الاستبدال

| الخطر | التخفيف |
|-------|---------|
| حظر/تقييد الأرقام | شروط استخدام واضحة؛ تحذير في UI الربط؛ rate limits + إيقاف تلقائي عند ارتفاع الأخطاء |
| توقف المكتبة / كسر البروتوكول | `MessagingProvider` interface؛ Mock للاختبار؛ مسار مستقبلي `CloudApiProvider` |
| سرقة الجلسة | تشفير AES-256-GCM + مفتاح خارج DB؛ لا عرض credentials في API/UI/logs |
| QR hijacking | token قصير العمر مقيّد بـdevice؛ قناة realtime مصادقة |
| تشغيل جهاز على عاملين | distributed lock + `worker_id` |
| ازدواج الإرسال | idempotency keys + event id داخل contract |

**خطة الاستبدال:** الإبقاء على أوامر/أحداث داخلية مستقرة (`device.*`, `message.*`)؛ تبديل التنفيذ خلف Provider دون تغيير Public API أو جداول الرسائل الأساسية.

---

## بعد الموافقة

ابدأ **المرحلة 1 فقط**: Monorepo + Docker + skeletons + health، واجعل المشروع قابلاً للتشغيل والاختبار قبل المرحلة 2.
