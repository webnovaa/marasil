import { FormEvent, useEffect, useRef, useState } from 'react';
import {
    Search,
    Send,
    Phone,
    User,
    Check,
    CheckCheck,
    Clock,
    Sparkles,
    Smartphone,
    RefreshCw,
    MessageSquare,
    ChevronDown,
    Plus,
    Smile,
    Paperclip,
} from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import TenantShell from '@/Layouts/TenantShell';

type Conversation = {
    phone: string;
    name: string;
    last_message: string;
    direction: 'inbound' | 'outbound';
    timestamp: string | null;
    unread: boolean;
};

type MessageItem = {
    id: string;
    type: 'inbound' | 'outbound';
    body: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'received' | 'pending';
    created_at: string;
    timestamp: number;
};

type DeviceOption = {
    id: number;
    ulid: string;
    display_name: string | null;
    phone_e164: string | null;
};

type Props = {
    conversations: Conversation[];
    devices: DeviceOption[];
};

const CANNED_RESPONSES = [
    'أهلاً بك! كيف يمكنني مساعدتك اليوم؟ 😊',
    'تم استلام طلبك وجارٍ معالجته مع فريق العمليات 📦',
    'شكراً لتواصلك معنا، يسعدنا دائماً خدمتك ✨',
    'هل تحتاج إلى مساعدة بخصوص أي منتج أو خدمة أخرى؟',
    'أوقات العمل الرسمية من 9 صباحاً حتى 9 مساءً.',
];

export default function ChatIndex({ conversations: initialConversations, devices }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [selectedPhone, setSelectedPhone] = useState<string>(
        initialConversations.length > 0 ? initialConversations[0].phone : ''
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<string>(
        devices.length > 0 ? devices[0].ulid : ''
    );
    const [showCanned, setShowCanned] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter conversations
    const filteredConversations = conversations.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery) ||
            c.last_message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentChat = conversations.find((c) => c.phone === selectedPhone);

    useEffect(() => {
        if (!selectedPhone) return;

        setLoadingMessages(true);
        fetch(`/chat/messages?phone=${encodeURIComponent(selectedPhone)}`)
            .then((res) => res.json())
            .then((data) => {
                setMessages(data.messages || []);
                setLoadingMessages(false);
            })
            .catch(() => setLoadingMessages(false));
    }, [selectedPhone]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSend(e: FormEvent) {
        e.preventDefault();
        if (!inputText.trim() || !selectedPhone || sending) return;

        const textToSend = inputText.trim();
        setInputText('');
        setSending(true);

        const optimisticMsg: MessageItem = {
            id: 'temp_' + Date.now(),
            type: 'outbound',
            body: textToSend,
            status: 'pending',
            created_at: new Date().toISOString(),
            timestamp: Math.floor(Date.now() / 1000),
        };

        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    phone: selectedPhone,
                    message: textToSend,
                    device_id: selectedDevice || null,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                // Update conversation snippet
                setConversations((prev) =>
                    prev.map((c) =>
                        c.phone === selectedPhone
                            ? {
                                  ...c,
                                  last_message: textToSend,
                                  direction: 'outbound',
                                  timestamp: new Date().toISOString(),
                              }
                            : c
                    )
                );
            }
        } catch {
            // failed
        } finally {
            setSending(false);
        }
    }

    return (
        <TenantShell title="المحادثات الحية">
            <div className="h-[calc(100vh-140px)] min-h-[580px] rounded-2xl border border-border/80 bg-background overflow-hidden flex flex-col shadow-xl">
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANEL: Conversation List */}
                    <div className="w-80 md:w-96 border-e border-border/70 flex flex-col bg-card/40">
                        {/* Header & Search */}
                        <div className="p-3.5 border-b border-border/70 space-y-3 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground">محادثات الواتساب</h3>
                                </div>
                                <span className="text-xs text-muted-foreground font-semibold">
                                    {conversations.length} جهة
                                </span>
                            </div>

                            <div className="relative">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث بالاسم أو الرقم أو الرسالة..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="ps-9 h-9 text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                            {filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    لا توجد محادثات مطابقة
                                </div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const isSelected = conv.phone === selectedPhone;
                                    return (
                                        <button
                                            key={conv.phone}
                                            type="button"
                                            onClick={() => setSelectedPhone(conv.phone)}
                                            className={`w-full p-3.5 flex items-start gap-3 text-start transition-colors ${
                                                isSelected
                                                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
                                                    : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                                                    {conv.name.charAt(0) || <User className="h-5 w-5" />}
                                                </div>
                                                {conv.unread && (
                                                    <span className="absolute -top-1 -end-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-xs text-foreground truncate">
                                                        {conv.name}
                                                    </h4>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {conv.timestamp
                                                            ? new Date(conv.timestamp).toLocaleTimeString('ar-SA', {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              })
                                                            : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate leading-snug">
                                                    {conv.direction === 'outbound' && 'أنت: '}
                                                    {conv.last_message || 'لا توجد رسائل سابقة'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Chat Thread */}
                    {currentChat ? (
                        <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
                            {/* Chat Header */}
                            <div className="bg-card px-4 py-3 border-b border-border/70 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                                        {currentChat.name.charAt(0) || <User className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground">{currentChat.name}</h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5" dir="ltr">
                                            <span>{currentChat.phone}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {devices.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border/60">
                                            <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
                                            <select
                                                value={selectedDevice}
                                                onChange={(e) => setSelectedDevice(e.target.value)}
                                                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                                            >
                                                {devices.map((d) => (
                                                    <option key={d.ulid} value={d.ulid}>
                                                        {d.display_name || d.phone_e164 || 'جهاز واتساب'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages Body */}
                            <div
                                className="flex-1 p-4 overflow-y-auto space-y-3"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 0)',
                                    backgroundSize: '16px 16px',
                                }}
                            >
                                {loadingMessages ? (
                                    <div className="flex justify-center p-8">
                                        <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
                                        <MessageSquare className="h-10 w-10 stroke-1 opacity-40" />
                                        <p className="text-xs">لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOut = msg.type === 'outbound';
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                                        isOut
                                                            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground rounded-te-none'
                                                            : 'bg-white dark:bg-[#202c33] text-foreground rounded-ts-none'
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                                                    <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-1">
                                                        <span>
                                                            {new Date(msg.created_at).toLocaleTimeString('ar-SA', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                        {isOut && (
                                                            <span>
                                                                {msg.status === 'read' ? (
                                                                    <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                                                                ) : msg.status === 'delivered' ? (
                                                                    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                                                ) : msg.status === 'sent' ? (
                                                                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                                                ) : (
                                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Canned responses bar */}
                            {showCanned && (
                                <div className="p-2 bg-muted/80 border-t border-border/70 flex flex-wrap gap-2">
                                    {CANNED_RESPONSES.map((res, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setInputText(res);
                                                setShowCanned(false);
                                            }}
                                            className="text-xs bg-background hover:bg-emerald-500/10 border border-border/60 rounded-lg px-2.5 py-1 text-foreground transition-colors"
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Message Composer */}
                            <form
                                onSubmit={handleSend}
                                className="bg-card p-3 border-t border-border/70 flex items-center gap-2"
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowCanned(!showCanned)}
                                    title="ردود سريعة جاهزة"
                                    className={`p-2 rounded-lg border transition-colors ${
                                        showCanned
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Sparkles className="h-4 w-4" />
                                </button>

                                <Input
                                    type="text"
                                    placeholder="اكتب رسالتك للعميل عبر واتساب..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={sending}
                                    className="bg-background border-border/80 h-10 text-sm"
                                />

                                <Button
                                    type="submit"
                                    disabled={sending || !inputText.trim()}
                                    className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0"
                                >
                                    {sending ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4 -scale-x-100" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10">
                            <MessageSquare className="h-16 w-16 stroke-1 text-emerald-500/40 mb-3" />
                            <h3 className="font-bold text-foreground text-base">مكتب المساعدة والمحادثات الحية</h3>
                            <p className="text-xs max-w-sm mt-1">
                                اختر محادثة من القائمة الجانبية للتواصل مع العميل والرد الفوري عليه عبر أجهزة الواتساب المربوطة.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </TenantShell>
    );
}
