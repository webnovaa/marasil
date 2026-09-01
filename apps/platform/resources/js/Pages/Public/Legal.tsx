import { Head } from '@inertiajs/react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';

type LegalPageProps = {
    title: string;
    updatedAt: string;
    paragraphs: string[];
};

export default function LegalPage({ title, updatedAt, paragraphs }: LegalPageProps) {
    return (
        <MarketingLayout>
            <Head title={title} />
            <article className="mx-auto max-w-[var(--content-max-forms)] px-4 py-14 md:px-8">
                <h1 className="text-h1 text-[rgb(var(--brand-950))]">{title}</h1>
                <p className="mt-2 text-caption text-[rgb(var(--subtle))]">آخر تحديث: {updatedAt}</p>
                <div className="mt-8 space-y-4 text-body leading-7 text-[rgb(var(--muted))]">
                    {paragraphs.map((p) => (
                        <p key={p.slice(0, 24)}>{p}</p>
                    ))}
                </div>
            </article>
        </MarketingLayout>
    );
}
