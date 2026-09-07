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
        <div className="inline-flex rounded-[var(--radius-full)] border border-[rgb(var(--border-soft))] bg-[rgb(var(--surface-soft))] p-0.5">
            <button
                type="button"
                className={`min-w-8 rounded-[var(--radius-full)] px-2.5 py-1 text-caption transition-colors ${
                    locale === 'ar'
                        ? 'bg-[rgb(var(--surface))] font-semibold text-[rgb(var(--brand-900))] shadow-[var(--shadow-xs)]'
                        : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text-primary))]'
                }`}
                onClick={() => switchTo('ar')}
            >
                ع
            </button>
            <button
                type="button"
                className={`min-w-8 rounded-[var(--radius-full)] px-2.5 py-1 text-caption transition-colors ${
                    locale === 'en'
                        ? 'bg-[rgb(var(--surface))] font-semibold text-[rgb(var(--brand-900))] shadow-[var(--shadow-xs)]'
                        : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text-primary))]'
                }`}
                onClick={() => switchTo('en')}
            >
                EN
            </button>
        </div>
    );
}
