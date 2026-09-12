import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertOctagon,
    AlertTriangle,
    Bell,
    Check,
    CheckCheck,
    Clock,
    Crown,
    ExternalLink,
    Megaphone,
    Sparkles,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';
import { Button } from '@/Components/ui/Button';
import { cn } from '@/Lib/cn';

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string | null;
}

interface PageProps {
    unreadNotifications?: number;
    recentNotifications?: NotificationItem[];
    [key: string]: unknown;
}

export function NotificationBellDropdown() {
    const page = usePage<PageProps>().props;
    const unread = page.unreadNotifications ?? 0;
    const notifications = page.recentNotifications ?? [];
    const [open, setOpen] = useState(false);

    // Auto-reload unread counts periodically
    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({ only: ['unreadNotifications', 'recentNotifications'] });
        }, 30000);

        return () => window.clearInterval(timer);
    }, []);

    function handleMarkAllRead() {
        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['unreadNotifications', 'recentNotifications'] });
                },
            }
        );
    }

    function handleItemClick(item: NotificationItem) {
        if (!item.read_at) {
            router.post(
                `/notifications/${item.id}/read`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload({ only: ['unreadNotifications', 'recentNotifications'] });
                    },
                }
            );
        }
        setOpen(false);
    }

    function renderTypeIcon(type: string) {
        if (type.startsWith('message.failed')) {
            return (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <AlertOctagon className="size-4" />
                </div>
            );
        }
        if (type.includes('urgent') || type.includes('security')) {
            return (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    <AlertTriangle className="size-4" />
                </div>
            );
        }
        if (type.includes('warning') || type.includes('device')) {
            return (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <AlertCircle className="size-4" />
                </div>
            );
        }
        if (type.includes('success') || type.includes('offer')) {
            return (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Sparkles className="size-4" />
                </div>
            );
        }
        if (type.includes('subscription')) {
            return (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Crown className="size-4" />
                </div>
            );
        }
        if (type.startsWith('broadcast')) {
            return (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Megaphone className="size-4" />
                </div>
            );
        }

        return (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Bell className="size-4" />
            </div>
        );
    }

    function formatTime(iso: string | null) {
        if (!iso) return '';
        try {
            const date = new Date(iso);
            return date.toLocaleDateString('ar-EG', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="relative inline-flex size-10 items-center justify-center rounded-full border border-[rgb(var(--border-soft))] bg-[rgb(var(--surface))] text-[rgb(var(--brand-800))] shadow-xs transition hover:bg-[rgb(var(--surface-soft))] focus:outline-none"
                    aria-label="الإشعارات"
                >
                    <Bell className="size-4" aria-hidden />
                    {unread > 0 ? (
                        <span className="absolute -top-1 -end-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-xs animate-pulse">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    ) : null}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80 sm:w-96 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-0 shadow-xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3 bg-[rgb(var(--surface-soft))]">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[rgb(var(--brand-950))]">
                            الإشعارات والتنبيهات
                        </span>
                        {unread > 0 ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                {unread} جديدة
                            </span>
                        ) : null}
                    </div>

                    {unread > 0 ? (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--brand-700))] hover:underline"
                        >
                            <CheckCheck className="size-3.5" />
                            تحديد الكل كمقروء
                        </button>
                    ) : null}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[rgb(var(--border))]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <Bell className="size-8 text-[rgb(var(--muted))] opacity-40 mb-2" />
                            <p className="text-xs font-bold text-[rgb(var(--text))]">لا توجد إشعارات جديدة</p>
                            <p className="text-[11px] text-[rgb(var(--muted))] mt-0.5">
                                سنخبرك فوراً بأي تحديثات أو تنبيهات على حسابك.
                            </p>
                        </div>
                    ) : (
                        notifications.map((item) => {
                            const isUnread = !item.read_at;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={cn(
                                        'flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-[rgb(var(--brand-50)_/_0.4)]',
                                        isUnread ? 'bg-emerald-50/20' : 'opacity-80'
                                    )}
                                >
                                    {renderTypeIcon(item.type)}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <p
                                                className={cn(
                                                    'text-xs truncate',
                                                    isUnread
                                                        ? 'font-black text-[rgb(var(--brand-950))]'
                                                        : 'font-semibold text-[rgb(var(--text))]'
                                                )}
                                            >
                                                {item.title}
                                            </p>
                                            {isUnread ? (
                                                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                            ) : null}
                                        </div>

                                        <p className="mt-0.5 text-caption line-clamp-2 text-[rgb(var(--muted))] leading-relaxed">
                                            {item.body}
                                        </p>

                                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[rgb(var(--subtle))]">
                                            <Clock className="size-3" />
                                            <span>{formatTime(item.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-[rgb(var(--border))] p-2.5 bg-[rgb(var(--surface-soft))] text-center">
                    <Link
                        href="/notifications"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--brand-700))] hover:underline"
                    >
                        <span>عرض جميع الإشعارات وتفضيلات التنبيه</span>
                        <ExternalLink className="size-3.5" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
