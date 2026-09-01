import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import TenantShell from '@/Layouts/TenantShell';
import { MessageSquare } from 'lucide-react';

type MessageRow = {
    id: string;
    device_id: string | null;
    to: string;
    type: string;
    status: string;
    queued_at: string | null;
    sent_at: string | null;
    error_code: string | null;
};

type Props = {
    messages: MessageRow[];
};

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'sent' || status === 'delivered') {
        return 'success';
    }
    if (status === 'failed') {
        return 'danger';
    }
    if (status === 'queued' || status === 'processing') {
        return 'warning';
    }
    return 'neutral';
}

export default function MessagesIndex({ messages }: Props) {
    return (
        <TenantShell title="الرسائل" description="حالة الإرسال كما هي في الخادم — queued ليست sent.">
            <div>
                <TenantPanel title={`آخر ${messages.length} رسالة`} flush>
                    {messages.length === 0 ? (
                        <TenantEmptyState
                            icon={MessageSquare}
                            title="لا توجد رسائل بعد"
                            description="أرسل عبر API بمفتاح mrs_live_ أو mrs_test_ بعد ربط جهاز متصل."
                        />
                    ) : (
                        <ul className="tenant-list">
                            {messages.map((message, index) => (
                                <li key={message.id} className="tenant-list__item" style={{ animationDelay: `${0.1 * (index + 2)}s` }}>
                                    <div className="min-w-0">
                                        <p className="tenant-list__primary" dir="ltr">
                                            {message.to}
                                        </p>
                                        <p className="tenant-list__secondary">
                                            {message.type} · {message.queued_at ?? message.id}
                                        </p>
                                    </div>
                                    <Badge tone={statusTone(message.status)}>{message.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
