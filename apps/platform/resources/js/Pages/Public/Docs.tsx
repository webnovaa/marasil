import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, KeyRound, Smartphone, Webhook, ShieldCheck } from 'lucide-react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';
import { Alert } from '@/Components/ui/Alert';
import { CodeBlock } from '@/Components/ui/CodeBlock';
import { LinkButton } from '@/Components/ui/LinkButton';

type Props = {
    apiBaseUrl: string;
    appOrigin: string;
};

const SECTIONS = [
    { id: 'start', label: 'البداية السريعة' },
    { id: 'device', label: 'ربط الجهاز' },
    { id: 'auth', label: 'المصادقة' },
    { id: 'send', label: 'إرسال رسالة' },
    { id: 'check-number', label: 'فحص وتأكيد الأرقام' },
    { id: 'status', label: 'متابعة الحالة' },
    { id: 'webhooks', label: 'إشعارات السيرفر' },
    { id: 'errors', label: 'الأخطاء والحدود' },
    { id: 'checklist', label: 'قائمة تحقق' },
] as const;

export default function DocsPage({ apiBaseUrl, appOrigin }: Props) {
    const curlExample = `curl -X POST "${apiBaseUrl}/messages/send" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "YOUR_USERNAME",
    "device": "YOUR_DEVICE_NAME",
    "to": "+9639XXXXXXXX",
    "message": "مرحبا من مراسيل"
  }'`;

    const getExample = `${apiBaseUrl}/messages/send?username=YOUR_USERNAME&device=YOUR_DEVICE_NAME&to=+9639XXXXXXXX&message=مرحبا+من+مراسيل`;

    const nodeExample = `const res = await fetch("${apiBaseUrl}/messages/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "YOUR_USERNAME",
    device: "YOUR_DEVICE_NAME",
    to: "+9639XXXXXXXX",
    message: "مرحبا من مراسيل",
  }),
});

const json = await res.json();
console.log(json);`;

    const phpExample = `$ch = curl_init('${apiBaseUrl}/messages/send');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'username' => 'YOUR_USERNAME',
    'device' => 'YOUR_DEVICE_NAME',
    'to' => '+9639XXXXXXXX',
    'message' => 'مرحبا من مراسيل',
  ], JSON_UNESCAPED_UNICODE),
]);
echo curl_exec($ch);`;

    const webhookVerify = `// Node example — verify HMAC signature
const crypto = require("crypto");

function verify(secret, timestamp, rawBody, signatureHeader) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(timestamp + "." + rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader),
  );
}`;

    return (
        <MarketingLayout>
            <Head title="توثيق المطوّرين — مراسيل" />

            <div className="mx-auto grid max-w-[var(--content-max-analytics)] gap-10 px-4 py-14 md:grid-cols-[220px_minmax(0,1fr)] md:px-8 md:py-20">
                <aside className="md:sticky md:top-24 md:self-start">
                    <p className="marketing-kicker">للمطوّرين</p>
                    <h1 className="mt-3 text-h2 text-[rgb(var(--brand-950))]">دليل الربط</h1>
                    <p className="mt-2 text-caption text-[rgb(var(--muted))]">اربط جهازك وأرسل عبر API بدون تعقيد.</p>
                    <nav className="mt-6 space-y-1">
                        {SECTIONS.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="block rounded-[var(--radius-md)] px-3 py-2 text-sm text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--surface-soft))] hover:text-[rgb(var(--brand-900))]"
                            >
                                {section.label}
                            </a>
                        ))}
                    </nav>
                    <div className="mt-6 flex flex-col gap-2">
                        <LinkButton href="/register" size="sm">
                            إنشاء حساب
                        </LinkButton>
                        <LinkButton href="/devices" variant="secondary" size="sm">
                            فتح الأجهزة
                        </LinkButton>
                    </div>
                </aside>

                <article className="min-w-0 space-y-12">
                    <section id="start" className="scroll-mt-28 space-y-4">
                        <h2 className="text-h2 text-[rgb(var(--brand-950))]">1) البداية السريعة</h2>
                        <ol className="space-y-3 text-body text-[rgb(var(--muted))]">
                            <li className="flex gap-3">
                                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-900))] text-xs font-bold text-white">1</span>
                                سجّل حساباً وتحقق من رقم واتساب عبر OTP، ثم فعّل اشتراكاً (تجربة مجانية أو خطة مدفوعة).
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-900))] text-xs font-bold text-white">2</span>
                                من لوحة التحكم → <strong>الأجهزة</strong> أنشئ جهازاً وامسح رمز QR من واتساب (الأجهزة المرتبطة).
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-900))] text-xs font-bold text-white">3</span>
                                بعد الاتصال، افتح صفحة الجهاز وانسخ: <strong>رابط الإرسال</strong>، <strong>اسم الجهاز</strong>، و<strong>اسم المستخدم</strong>.
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-900))] text-xs font-bold text-white">4</span>
                                أرسل طلبك مباشرة عبر POST أو رابط GET سريع بدون أي مفاتيح API.
                            </li>
                        </ol>
                        <Alert tone="neutral" title="رابط الإرسال">
                            <code dir="ltr">{`${apiBaseUrl}/messages/send`}</code>
                        </Alert>
                    </section>

                    <section id="device" className="scroll-mt-28 space-y-4">
                        <h2 className="flex items-center gap-2 text-h2 text-[rgb(var(--brand-950))]">
                            <Smartphone className="size-6" /> 2) ربط الجهاز بشكل صحيح
                        </h2>
                        <ul className="list-disc space-y-2 pe-5 text-body text-[rgb(var(--muted))]">
                            <li>الجهاز لازم يكون بحالة <strong>متصل</strong> قبل أي إرسال.</li>
                            <li>افتح واتساب على الهاتف → الإعدادات → الأجهزة المرتبطة → ربط جهاز → امسح QR.</li>
                            <li>لا تسجّل خروج واتساب من الهاتف أثناء الربط، ولا تعيد مسح QR على جلسة أخرى لنفس الجهاز إلا بعد Logout من اللوحة.</li>
                            <li>اختبر الإرسال من زر «تجربة الإرسال» داخل صفحة الجهاز قبل الربط بمشروعك.</li>
                        </ul>
                    </section>

                    <section id="auth" className="scroll-mt-28 space-y-4">
                        <h2 className="flex items-center gap-2 text-h2 text-[rgb(var(--brand-950))]">
                            <KeyRound className="size-6" /> 3) بيانات الربط (طريقة سهلة ومباشرة)
                        </h2>
                        <p className="text-body text-[rgb(var(--muted))]">
                            لا حاجة لإنشاء أو إدارة مفاتيح API معقدة أو Bearer tokens. الربط مع أي متجر أو نظام خارجي يحتاج فقط:
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3 pt-2">
                            <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-soft))] p-3">
                                <span className="text-xs font-semibold text-[rgb(var(--muted))]">العنصر 1</span>
                                <p className="text-sm font-bold text-[rgb(var(--brand-950))]">رابط الإرسال</p>
                                <p className="text-xs text-[rgb(var(--muted))] mt-1">الرابط المباشر الذي تستقبله المنصة لإرسال الرسائل.</p>
                            </div>
                            <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-soft))] p-3">
                                <span className="text-xs font-semibold text-[rgb(var(--muted))]">العنصر 2</span>
                                <p className="text-sm font-bold text-[rgb(var(--brand-950))]">اسم الجهاز</p>
                                <p className="text-xs text-[rgb(var(--muted))] mt-1">اسم الجهاز الذي حددته في لوحة التحكم.</p>
                            </div>
                            <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-soft))] p-3">
                                <span className="text-xs font-semibold text-[rgb(var(--muted))]">العنصر 3</span>
                                <p className="text-sm font-bold text-[rgb(var(--brand-950))]">اسم المستخدم</p>
                                <p className="text-xs text-[rgb(var(--muted))] mt-1">معرّف حسابك (الـ Username أو رقم الهاتف).</p>
                            </div>
                        </div>
                    </section>

                    <section id="send" className="scroll-mt-28 space-y-4">
                        <h2 className="text-h2 text-[rgb(var(--brand-950))]">4) إرسال رسالة نصية</h2>
                        <p className="text-body text-[rgb(var(--muted))]">
                            يمكنك الإرسال عبر طلب POST مع JSON أو استخدام رابط GET المباشر المناسب جداً للـ Webhooks:
                        </p>
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[rgb(var(--brand-950))]">أ) طلب POST (JSON)</h4>
                            <CodeBlock language="bash" code={curlExample} />
                            
                            <h4 className="text-sm font-semibold text-[rgb(var(--brand-950))] pt-2">ب) رابط GET مباشر (للمتصفح والـ Webhooks)</h4>
                            <CodeBlock language="http" code={getExample} />

                            <h4 className="text-sm font-semibold text-[rgb(var(--brand-950))] pt-2">ج) كود Node.js</h4>
                            <CodeBlock language="javascript" code={nodeExample} />

                            <h4 className="text-sm font-semibold text-[rgb(var(--brand-950))] pt-2">د) كود PHP</h4>
                            <CodeBlock language="php" code={phpExample} />
                        </div>
                        <Alert tone="info" title="شكل الاستجابة الناجحة">
                            الطلب يُقبل عادةً بـ <code dir="ltr">202</code> مع معرّف الرسالة وحالة مثل <code dir="ltr">queued</code>. هذا يعني القبول في الطابور بنجاح.
                        </Alert>
                    </section>

                    <section id="check-number" className="scroll-mt-28 space-y-4">
                        <h2 className="flex items-center gap-2 text-h2 text-[rgb(var(--brand-950))]">
                            <ShieldCheck className="size-6 text-emerald-600" /> 5) فحص وتأكيد أرقام الواتساب (Lookup API)
                        </h2>
                        <p className="text-body text-[rgb(var(--muted))]">
                            ميزة أمان فائقة: تحقق فورياً مما إذا كان رقم العميل يملك حساب واتساب نشط قبل إرسال الرسائل في متجرك (سلة، زد، ووكومرس، CRM) لتجنب حظر الأرقام الناتج عن مراسلة أرقام وهمية أو غير مسجلة.
                        </p>

                        <div className="space-y-3">
                            <h3 className="text-h3 text-[rgb(var(--brand-950))]">أ) استدعاء مباشر GET / Webhook</h3>
                            <CodeBlock
                                language="http"
                                code={`${apiBaseUrl}/numbers/check?username=YOUR_USERNAME&device=YOUR_DEVICE_NAME&phone=+9639XXXXXXXX`}
                            />

                            <h3 className="text-h3 text-[rgb(var(--brand-950))] pt-2">ب) طلب POST (JSON)</h3>
                            <CodeBlock
                                language="bash"
                                code={`curl -X POST "${apiBaseUrl}/numbers/check" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "YOUR_USERNAME",
    "device": "YOUR_DEVICE_NAME",
    "phone": "+9639XXXXXXXX"
  }'`}
                            />

                            <h3 className="text-h3 text-[rgb(var(--brand-950))] pt-2">ج) نموذج استجابة الفحص</h3>
                            <CodeBlock
                                language="json"
                                code={`{
  "success": true,
  "data": {
    "phone": "+9639XXXXXXXX",
    "exists": true,
    "status": "valid",
    "device": "YOUR_DEVICE_NAME",
    "message": "الرقم يملك حساب واتساب نشط وجاهز لاستقبال الرسائل"
  }
}`}
                            />
                        </div>
                    </section>

                    <section id="status" className="scroll-mt-28 space-y-4">
                        <h2 className="text-h2 text-[rgb(var(--brand-950))]">6) متابعة حالة الرسالة</h2>
                        <CodeBlock
                            language="bash"
                            code={`curl "${apiBaseUrl}/messages/{message_ulid}" \\
  -H "Authorization: Bearer mrs_live_YOUR_KEY"`}
                        />
                        <p className="text-body-sm text-[rgb(var(--muted))]">
                            أو راقب الرسائل من لوحة التحكم: <Link href="/messages" className="underline">/messages</Link>
                        </p>
                    </section>

                    <section id="webhooks" className="scroll-mt-28 space-y-4">
                        <h2 className="flex items-center gap-2 text-h2 text-[rgb(var(--brand-950))]">
                            <Webhook className="size-6" /> 7) إشعارات السيرفر (اختياري)
                        </h2>
                        <p className="text-body text-[rgb(var(--muted))]">
                            لمعظم الحسابات يكفي تفعيل تنبيهات واتساب من صفحة <Link href="/webhooks" className="underline">إشعارات الإرسال</Link>.
                            إذا عندك سيرفر، اربط URL ليستقبل أحداث مثل <code dir="ltr">message.sent</code> و<code dir="ltr">message.failed</code>.
                        </p>
                        <ul className="list-disc space-y-2 pe-5 text-body-sm text-[rgb(var(--muted))]">
                            <li>
                                الرؤوس: <code dir="ltr">X-Webhook-Id</code> · <code dir="ltr">X-Webhook-Timestamp</code> ·{' '}
                                <code dir="ltr">X-Webhook-Signature</code>
                            </li>
                            <li>
                                التوقيع: <code dir="ltr">sha256=HMAC_SHA256(secret, timestamp + "." + rawBody)</code>
                            </li>
                            <li>أجب بـ 2xx بسرعة، وإلا تُعاد المحاولة ثم يُنبَّه صاحب الحساب.</li>
                        </ul>
                        <CodeBlock language="javascript" code={webhookVerify} />
                    </section>

                    <section id="errors" className="scroll-mt-28 space-y-4">
                        <h2 className="text-h2 text-[rgb(var(--brand-950))]">8) أخطاء شائعة وحدود الخطة</h2>
                        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[rgb(var(--border))]">
                            <table className="w-full min-w-[32rem] text-start text-sm">
                                <thead className="bg-[rgb(var(--surface-soft))] text-[rgb(var(--brand-950))]">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">الرمز</th>
                                        <th className="px-4 py-3 font-semibold">المعنى</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[rgb(var(--muted))]">
                                    <tr className="border-t border-[rgb(var(--border-soft))]">
                                        <td className="px-4 py-3 font-mono" dir="ltr">
                                            SUBSCRIPTION_REQUIRED
                                        </td>
                                        <td className="px-4 py-3">لا يوجد اشتراك فعّال</td>
                                    </tr>
                                    <tr className="border-t border-[rgb(var(--border-soft))]">
                                        <td className="px-4 py-3 font-mono" dir="ltr">
                                            MESSAGE_QUOTA_EXCEEDED
                                        </td>
                                        <td className="px-4 py-3">تم بلوغ الحد الشهري</td>
                                    </tr>
                                    <tr className="border-t border-[rgb(var(--border-soft))]">
                                        <td className="px-4 py-3 font-mono" dir="ltr">
                                            DAILY_DEVICE_QUOTA_EXCEEDED
                                        </td>
                                        <td className="px-4 py-3">تم بلوغ الحد اليومي للجهاز</td>
                                    </tr>
                                    <tr className="border-t border-[rgb(var(--border-soft))]">
                                        <td className="px-4 py-3 font-mono" dir="ltr">
                                            DEVICE_NOT_CONNECTED
                                        </td>
                                        <td className="px-4 py-3">الجهاز غير متصل — أعد مسح QR</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section id="checklist" className="scroll-mt-28 space-y-4">
                        <h2 className="text-h2 text-[rgb(var(--brand-950))]">9) قائمة تحقق قبل الإطلاق</h2>
                        <ul className="space-y-2 text-body text-[rgb(var(--muted))]">
                            {[
                                'الجهاز متصل في لوحة التحكم',
                                'API Key مخزّن في البيئة وليس في الكود المصدري',
                                'Idempotency-Key فريد لكل إرسال منطقي',
                                'الأرقام بصيغة E.164 مثل +9639…',
                                'تم اختبار رسالة تجريبية بنجاح',
                                'تنبيهات الفشل مفعّلة أو Webhook جاهز',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[rgb(var(--success-600))]" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-caption text-[rgb(var(--subtle))]">
                            مرجع تقني إضافي للعقود: مستودع المشروع تحت <code dir="ltr">docs/api.md</code> و{' '}
                            <code dir="ltr">docs/openapi.yaml</code> · المنصة: <code dir="ltr">{appOrigin}</code>
                        </p>
                    </section>
                </article>
            </div>
        </MarketingLayout>
    );
}
