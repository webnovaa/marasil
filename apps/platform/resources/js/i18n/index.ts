export type Locale = 'ar' | 'en';

const messages = {
    ar: {
        dashboard: 'لوحة التحكم',
        devices: 'الأجهزة',
        messages: 'الرسائل',
        subscription: 'الاشتراك',
        notifications: 'الإشعارات',
        usage: 'الاستخدام',
        billing: 'الفوترة',
        support: 'الدعم',
        profile: 'الملف الشخصي',
        team: 'الفريق',
        templates: 'القوالب',
        logout: 'تسجيل الخروج',
    },
    en: {
        dashboard: 'Dashboard',
        devices: 'Devices',
        messages: 'Messages',
        subscription: 'Subscription',
        notifications: 'Notifications',
        usage: 'Usage',
        billing: 'Billing',
        support: 'Support',
        profile: 'Profile',
        team: 'Team',
        templates: 'Templates',
        logout: 'Log out',
    },
} as const;

export function t(locale: Locale, key: keyof (typeof messages)['ar']): string {
    return messages[locale][key] ?? messages.ar[key];
}
