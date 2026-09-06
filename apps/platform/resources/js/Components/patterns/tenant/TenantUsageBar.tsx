type TenantUsageBarProps = {
    current: number;
    max: number;
    label?: string;
    locale?: 'ar' | 'en';
};

export function TenantUsageBar({ current, max, label, locale = 'ar' }: TenantUsageBarProps) {
    const safeMax = max > 0 ? max : 1;
    const percent = Math.max(0, Math.min(100, Math.round((current / safeMax) * 100)));
    const fillClass =
        percent >= 90 ? 'tenant-usage__fill--danger' : percent >= 70 ? 'tenant-usage__fill--warn' : '';

    return (
        <div className="tenant-usage">
            <div className="tenant-usage__labels">
                <span>{label ?? 'الاستخدام'}</span>
                <span className="font-tabular" dir="ltr">
                    {current.toLocaleString(locale)} / {max.toLocaleString(locale)}
                </span>
            </div>
            <div className="tenant-usage__track" role="progressbar" aria-label={label ?? (locale === 'ar' ? 'الاستخدام' : 'Usage')} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className={`tenant-usage__fill ${fillClass}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
