import { BarChart3 } from 'lucide-react';

export type ActivityDay = { date: string; total: number };

export function DashboardActivity({ days, locale }: { days: ActivityDay[]; locale: 'ar' | 'en' }) {
    const total = days.reduce((sum, day) => sum + day.total, 0);
    const peak = Math.max(1, ...days.map((day) => day.total));
    const number = new Intl.NumberFormat(locale);
    const date = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    return (
        <section className="dashboard-activity" aria-label={locale === 'ar' ? 'نشاط الرسائل خلال سبعة أيام' : 'Message activity over seven days'}>
            <div className="dashboard-section-head">
                <div>
                    <h2>{locale === 'ar' ? 'نشاط الرسائل' : 'Message activity'}</h2>
                    <p>{locale === 'ar' ? 'الرسائل المقبولة خلال آخر ٧ أيام · UTC' : 'Accepted messages in the last 7 days · UTC'}</p>
                </div>
                <BarChart3 className="size-5 text-[rgb(var(--brand-600))]" aria-hidden />
            </div>
            <div className="dashboard-activity__summary">
                <strong>{number.format(total)}</strong>
                <span>{locale === 'ar' ? 'رسالة خلال الفترة' : 'messages this period'}</span>
            </div>
            {total === 0 ? <p className="dashboard-activity__empty">{locale === 'ar' ? 'لا يوجد نشاط بعد. ستظهر رسائلك هنا عند بدء الإرسال.' : 'No activity yet. Your messages will appear here when you start sending.'}</p> : null}
            <div className="dashboard-chart" role="list">
                {days.map((day) => (
                    <div key={day.date} className="dashboard-chart__column" role="listitem" aria-label={`${day.date}: ${number.format(day.total)}`}>
                        <span className="dashboard-chart__value">{number.format(day.total)}</span>
                        <div className="dashboard-chart__track" aria-hidden>
                            <div className="dashboard-chart__bar" style={{ height: `${day.total / peak * 100}%` }} />
                        </div>
                        <span className="dashboard-chart__label">{date.format(new Date(`${day.date}T00:00:00Z`))}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
