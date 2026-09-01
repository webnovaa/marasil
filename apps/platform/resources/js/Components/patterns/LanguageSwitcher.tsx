import { router, usePage } from '@inertiajs/react';

export function LanguageSwitcher() {
    const locale = (usePage().props.locale as string | undefined) ?? 'ar';

    function switchTo(next: 'ar' | 'en') {
        if (next === locale) {
            return;
        }

        router.post('/locale', { locale: next }, { preserveScroll: true });
    }

    return (
        <div className="inline-flex overflow-hidden rounded-[var(--radius-md)] border border-[rgb(var(--border))]">
            <button
                type="button"
                className={`px-2 py-1 text-caption ${locale === 'ar' ? 'bg-[rgb(var(--brand-100))] font-semibold text-[rgb(var(--brand-900))]' : 'text-[rgb(var(--muted))]'}`}
                onClick={() => switchTo('ar')}
            >
                ع
            </button>
            <button
                type="button"
                className={`px-2 py-1 text-caption ${locale === 'en' ? 'bg-[rgb(var(--brand-100))] font-semibold text-[rgb(var(--brand-900))]' : 'text-[rgb(var(--muted))]'}`}
                onClick={() => switchTo('en')}
            >
                EN
            </button>
        </div>
    );
}
