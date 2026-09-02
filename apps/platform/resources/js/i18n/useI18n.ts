import { usePage } from '@inertiajs/react';
import { t as translate, type Locale } from './messages';

type SharedPageProps = {
    locale?: Locale;
};

export function useI18n() {
    const { locale = 'ar' } = usePage<{ locale?: Locale }>().props as SharedPageProps;
    const safeLocale: Locale = locale === 'en' ? 'en' : 'ar';

    return {
        locale: safeLocale,
        dir: safeLocale === 'ar' ? 'rtl' : 'ltr',
        t: (key: string, params?: Record<string, string | number>) => translate(safeLocale, key, params),
        formatDate: (value: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
            if (!value) return translate(safeLocale, 'common.emDash');
            return new Intl.DateTimeFormat(safeLocale, {
                dateStyle: 'short',
                timeStyle: 'short',
                ...options,
            }).format(new Date(value));
        },
    };
}
