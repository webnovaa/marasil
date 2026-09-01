type TenantUsageBarProps = {
    current: number;
    max: number;
    label?: string;
};

export function TenantUsageBar({ current, max, label }: TenantUsageBarProps) {
    const safeMax = max > 0 ? max : 1;
    const percent = Math.min(100, Math.round((current / safeMax) * 100));
    const fillClass =
        percent >= 90 ? 'tenant-usage__fill--danger' : percent >= 70 ? 'tenant-usage__fill--warn' : '';

    return (
        <div className="tenant-usage">
            <div className="tenant-usage__labels">
                <span>{label ?? 'الاستخدام'}</span>
                <span className="font-tabular">
                    {current.toLocaleString('ar')} / {max.toLocaleString('ar')}
                </span>
            </div>
            <div className="tenant-usage__track" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={max}>
                <div className={`tenant-usage__fill ${fillClass}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
