# دليل المطوّر — ربط مراسيل (Marasil)

دليل عملي لربط مشروعك أو متجرك بمنصة مراسيل وإرسال رسائل واتساب عبر API بدون أي تعقيد.

## الفكرة الأساسية

**الربط يتم عبر 3 عناصر فقط بدون أي مفاتيح API:**
1. **رابط الإرسال (Send URL)**
2. **اسم الجهاز (Device Name)**
3. **اسم المستخدم (Username)**

## 1) ابدأ من لوحة التحكم

1. سجّل حساباً وتحقق من رقم واتساب (OTP).
2. فعّل اشتراكاً (تجربة مجانية أو خطة مدفوعة).
3. من **الأجهزة** أنشئ جهازاً وامسح QR من واتساب → الأجهزة المرتبطة.
4. انتظر حالة **متصل**.
5. من قسم **بيانات ربط الجهاز والإرسال** انسخ:
   - رابط الإرسال
   - اسم الجهاز
   - اسم المستخدم

## 2) رابط الإرسال (Send URL)

```
https://YOUR_DOMAIN/api/v1/messages/send
```

محلياً غالباً:

```
http://localhost:8080/api/v1/messages/send
```

## 3) المصادقة والربط

لا تحتاج إلى إنشاء أو إدارة مفاتيح API أو تمرير Bearer Tokens. يكفي تمرير:
- `username`: اسم المستخدم الخاص بحسابك.
- `device`: اسم الجهاز الذي ربطته بالواتساب.

## 4) إرسال رسالة نصية

### أ) طلب POST (JSON)

```bash
curl -X POST "https://YOUR_DOMAIN/api/v1/messages/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME",
    "device": "YOUR_DEVICE_NAME",
    "to": "+9639XXXXXXXX",
    "message": "مرحبا من مراسيل"
  }'
```

### ب) رابط مباشر سريع GET (للمتصفح والـ Webhooks)

```http
https://YOUR_DOMAIN/api/v1/messages/send?username=YOUR_USERNAME&device=YOUR_DEVICE_NAME&to=+9639XXXXXXXX&message=مرحبا
```

### ج) ميزة تنويع النصوص التلقائي (Spintax) لمكافحة الحظر

يدعم النظام صياغة Spintax لتوليد نصوص مختلفة عشوائياً لكل مستلم:
```json
{
  "username": "YOUR_USERNAME",
  "device": "YOUR_DEVICE_NAME",
  "to": "+9639XXXXXXXX",
  "message": "{مرحباً|أهلاً بك|السلام عليكم} عزيزنا {العميل|المشترك}، طلبك #{101|102} {جاهز|تم تجهيزه}."
}
```
يقوم النظام تلقائياً باختيار صياغة فريدة لكل رسالة لإعطاء بصمة نصية مختلفة تماماً وحماية الرقم من كشف التكرار.

### قواعد وحلول الأمان ومكافحة الحظر المدمجة

- **تسجيل جهات الاتصال تلقائياً:** يقوم النظام آلياً بتسجيل وحفظ رقم المستلم باسم طبيعي في دفتر جهات اتصال الواتساب قبل الإرسال لتبدو المحادثة طبيعية بين طرفين مسجلين.
- **التحقق المسبق (onWhatsApp):** يتم فحص الرقم آلياً؛ وإذا لم يكن مسجلاً في واتساب يلغى الإرسال لحماية مؤشر الحساب.
- **محاكاة السلوك البشري:** يظهر الحساب متصلاً (`available`) ثم يرسل إشارة كتابة (`composing`) لمدة تتناسب مع طول الرسالة ثم يرسل.
- الرقم بصيغة **E.164** فقط (`+` ثم رمز الدولة ثم الرقم).
- أرسل لمستلمين **موافقين** فقط.
- الاستجابة `202` تعني **قبول الطلب في الطابور** بنجاح.

## 5) ميزة فحص وتأكيد أرقام الواتساب (WhatsApp Number Lookup API)

تتيح لك هذه الميزة الحصرية التحقق اللحظي مما إذا كان رقم العميل يملك حساب واتساب نشط ومسجل قبل إرسال الرسالة أو أثناء كتابة العميل لرقمه في متجرك (سلة، زد، ووكومرس، CRM):

### أ) رابط الفحص (Check URL)

```
https://YOUR_DOMAIN/api/v1/numbers/check
```

### ب) استدعاء مباشر GET / Webhook

```http
https://YOUR_DOMAIN/api/v1/numbers/check?username=YOUR_USERNAME&device=YOUR_DEVICE_NAME&phone=+9639XXXXXXXX
```

### ج) استدعاء POST (JSON)

```bash
curl -X POST "https://YOUR_DOMAIN/api/v1/numbers/check" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME",
    "device": "YOUR_DEVICE_NAME",
    "phone": "+9639XXXXXXXX"
  }'
```

### د) نموذج الاستجابة (JSON Response)

إذا كان الرقم مسجلاً على واتساب:
```json
{
  "success": true,
  "data": {
    "phone": "+9639XXXXXXXX",
    "exists": true,
    "status": "valid",
    "device": "YOUR_DEVICE_NAME",
    "message": "الرقم يملك حساب واتساب نشط وجاهز لاستقبال الرسائل"
  }
}
```

إذا كان الرقم غير مسجل على واتساب:
```json
{
  "success": true,
  "data": {
    "phone": "+9639XXXXXXXX",
    "exists": false,
    "status": "not_registered",
    "device": "YOUR_DEVICE_NAME",
    "message": "الرقم غير مسجل على واتساب"
  }
}
```

## 6) متابعة الحالة

```bash
curl "https://YOUR_DOMAIN/api/v1/messages/{message_ulid}" \
  -H "Authorization: Bearer mrs_live_YOUR_KEY"
```

أو من الواجهة: `/messages`

## 6) إشعارات النتيجة

### الطريقة السهلة

من `/webhooks` فعّل تنبيهات واتساب/اللوحة عند فشل الإرسال — بدون سيرفر.

### رابط سيرفر (اختياري للمطورين)

اربط URL يستقبل أحداث مثل `message.sent` و `message.failed` مع التحقق من HMAC.

## 7) أخطاء شائعة

| الرمز | الحل |
|------|------|
| `SUBSCRIPTION_REQUIRED` | فعّل/جدّد الاشتراك |
| `MESSAGE_QUOTA_EXCEEDED` | انتظر دورة جديدة أو رقِّ الخطة |
| `DAILY_DEVICE_QUOTA_EXCEEDED` | انتظر اليوم التالي أو رقِّ الخطة |
| `DEVICE_NOT_CONNECTED` | أعد ربط الجهاز بـ QR |
| `DEVICE_KEY_REQUIRED` | لا تنشئ مفتاحاً يدوياً — استخدم مفتاح الجهاز |

## 8) قائمة تحقق قبل الإطلاق

- [ ] الجهاز متصل
- [ ] اختبار إرسال من اللوحة نجح
- [ ] المفتاح من صفحة الجهاز ومخزّن في البيئة
- [ ] `Idempotency-Key` مفعّل
- [ ] أرقام E.164 صحيحة
- [ ] تنبيهات الفشل أو Webhook جاهزة

## 9) روابط مفيدة

- التوثيق داخل المنصة: `/docs`
- الأجهزة: `/devices`
- إشعارات الإرسال: `/webhooks`
- مرجع العقود: `docs/api.md` · `docs/openapi.yaml`
