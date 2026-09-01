import { Head } from '@inertiajs/react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';

export default function DocsPage() {
    return (
        <MarketingLayout>
            <Head title="التوثيق" />
            <article className="mx-auto max-w-[var(--content-max-forms)] px-4 py-14 md:px-8">
                <h1 className="text-h1 text-[rgb(var(--brand-950))]">توثيق واجهة مراسيل</h1>
                <p className="mt-3 text-body text-[rgb(var(--muted))]">
                    المصدر التفصيلي في <code dir="ltr">docs/api.md</code> و<code dir="ltr">docs/openapi.yaml</code>.
                    المفاتيح الحالية تبدأ بـ <code dir="ltr">mrs_live_</code> و<code dir="ltr">mrs_test_</code>.
                </p>
                <pre className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 font-mono text-xs" dir="ltr">
{`curl -X POST https://api.example.com/api/v1/messages/text \\
  -H "Authorization: Bearer mrs_live_xxxxxxxx_..." \\
  -H "Idempotency-Key: order-100" \\
  -H "Content-Type: application/json" \\
  -d '{"device_id":"...","to":"+9639...","message":"hello"}'`}
                </pre>
            </article>
        </MarketingLayout>
    );
}
