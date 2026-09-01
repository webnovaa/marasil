# نموذج التهديدات — WhatsApp API SaaS

## نطاق

يغطي الإصدار الأول: لوحة المستأجر، لوحة الأدمن، Public API، WhatsApp Service، Queues، Webhooks، النسخ الاحتياطية.

## أصول عالية القيمة

- جلسات Baileys المشفّرة
- API keys وwebhook secrets
- بيانات المستأجرين والرسائل
- حسابات الإدارة
- مفاتيح التشفير الرئيسية (ENV/KMS)
- نسخ PostgreSQL الاحتياطية

## تهديدات رئيسية وتخفيف

| التهديد | السيناريو | التخفيف |
|---------|-----------|---------|
| Tenant escape | الوصول لموارد مستأجر آخر عبر IDOR | Policies + tenant scopes؛ ULID؛ اختبارات عزل إلزامية |
| Stolen API key | إرسال رسائل باسم الضحية | Hash فقط؛ abilities؛ rate limits؛ rotate/revoke؛ آخر استخدام؛ تنبيهات |
| Webhook SSRF | URL يشير لشبكة داخلية | HTTPS؛ منع private/loopback؛ إعادة تحقق DNS؛ لا redirects خطرة |
| Replay | إعادة طلب/حدث موقّع | timestamp window؛ event/command id؛ idempotency |
| QR hijacking | اعتراض QR أو token realtime | token قصير العمر مقيّد بـdevice؛ قناة مصادقة؛ لا تخزين QR في logs |
| Session theft | تسريب credentials من disk/logs | AES-256-GCM envelope؛ مفتاح خارج DB؛ لا عرض في API/Admin؛ تنقيح logs |
| Queue duplication | إرسال مزدوج | idempotency keys؛ timeout < retry_after؛ locks لكل device عند الحاجة |
| Abuse / spam | إرسال جماعي غير مرغوب | شروط استخدام؛ حصص؛ إيقاف تلقائي عند فشل مرتفع؛ موافقة أدمن للحسابات |
| Admin compromise | سيطرة على لوحة الإدارة | 2FA إلزامي قبل الإنتاج؛ RBAC دقيق؛ Audit؛ جلسات قابلة للإبطال |
| Backup leakage | تسريب dump | تشفير النسخ؛ صلاحيات محدودة؛ اختبار restore في بيئة معزولة |
| Provider lock-in / Ban | كسر Baileys أو حظر رقم | تحذيرات قانونية؛ Provider abstraction؛ مسار Cloud API |
| Internal service spoofing | تزييف أحداث Node→Laravel | HMAC + version + timestamp؛ شبكة internal فقط |

## حدود صريحة

- Rate limiting **لا يمنع** حظر واتساب.
- Baileys غير رسمي وقد يتوقف؛ يظهر ذلك في الشروط وواجهة الربط.
- لا ضمان تسليم 100% من طرف WhatsApp.

## ضوابط أفقية

- TLS خارجي
- لا منافذ Postgres/Redis/WA للعامة في الإنتاج
- Structured logs منقّحة
- Secret scanning في CI
- مبدأ أقل صلاحية للحاويات (non-root حيثما أمكن)
