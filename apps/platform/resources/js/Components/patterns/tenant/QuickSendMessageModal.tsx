import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { 
    Send, 
    Smartphone, 
    CheckCircle2, 
    AlertCircle, 
    Shuffle, 
    FileUp, 
    X,
    Loader2
} from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/Dialog';
import axios from 'axios';

type DeviceOption = {
    id: string | number;
    ulid: string;
    display_name?: string | null;
    phone_e164?: string | null;
    status?: string;
};

type Props = {
    devices: DeviceOption[];
    initialDeviceId?: string;
    trigger?: React.ReactNode;
};

export function QuickSendMessageModal({ devices, initialDeviceId, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [deviceId, setDeviceId] = useState(initialDeviceId || (devices[0]?.ulid ?? ''));
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [checkingNumber, setCheckingNumber] = useState(false);
    const [numberStatus, setNumberStatus] = useState<{ checked: boolean; exists?: boolean; error?: string } | null>(null);
    const [spintaxPreview, setSpintaxPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Live Spintax resolver for preview
    function previewSpintax() {
        if (!message) return;
        const processed = message.replace(/\{([^{}]+)\}/g, (_, choices) => {
            const arr = choices.split('|');
            return arr[Math.floor(Math.random() * arr.length)] || '';
        });
        setSpintaxPreview(processed);
    }

    async function checkNumberOnWhatsApp() {
        if (!recipient || !deviceId) return;
        setCheckingNumber(true);
        setNumberStatus(null);
        try {
            const cleanPhone = '+' + recipient.replace(/\D/g, '').replace(/^\+/, '');
            const res = await axios.post(`/api/v1/devices/${deviceId}/check-number`, {
                phone_number: cleanPhone,
            });
            const exists = res.data?.data?.exists ?? res.data?.exists ?? false;
            setNumberStatus({ checked: true, exists });
        } catch {
            setNumberStatus({ checked: true, exists: false, error: 'تعذر الاتصال بالجهاز لفحص الرقم' });
        } finally {
            setCheckingNumber(false);
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!deviceId || !recipient || !message) return;

        setSubmitting(true);
        const formData = new FormData();
        formData.append('device_id', deviceId);
        formData.append('recipient', recipient);
        formData.append('message', message);
        if (mediaFile) {
            formData.append('media_file', mediaFile);
        }

        router.post('/messages/quick', formData, {
            onSuccess: () => {
                setOpen(false);
                setMessage('');
                setRecipient('');
                setMediaFile(null);
                setNumberStatus(null);
                setSpintaxPreview(null);
            },
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="primary" size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                        <Send className="h-4 w-4" />
                        <span>إرسال رسالة سريعة</span>
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[540px] p-6 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Send className="h-5 w-5" />
                        </div>
                        إرسال رسالة واتساب مباشرة
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-3">
                    {/* Device Selector */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1.5">
                            جهاز الإرسال
                        </label>
                        <select
                            value={deviceId}
                            onChange={(e) => {
                                setDeviceId(e.target.value);
                                setNumberStatus(null);
                            }}
                            className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            required
                        >
                            {devices.length === 0 ? (
                                <option value="">لا يوجد أجهزة متصلة</option>
                            ) : (
                                devices.map((d) => (
                                    <option key={d.ulid} value={d.ulid}>
                                        {d.display_name || 'جهاز واتساب'} ({d.phone_e164 || d.ulid.slice(0, 8)})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Recipient Input with Check WhatsApp Button */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                                رقم المستلم الدولي
                            </label>
                            <button
                                type="button"
                                onClick={checkNumberOnWhatsApp}
                                disabled={checkingNumber || !recipient || !deviceId}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                            >
                                {checkingNumber ? <Loader2 className="h-3 w-3 animate-spin" /> : <Smartphone className="h-3 w-3" />}
                                تحقق من توفر واتساب
                            </button>
                        </div>
                        <Input
                            dir="ltr"
                            placeholder="+966500000000 أو +963900000000"
                            value={recipient}
                            onChange={(e) => {
                                setRecipient(e.target.value);
                                setNumberStatus(null);
                            }}
                            required
                            className="text-start font-mono"
                        />
                        {numberStatus && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                                {numberStatus.exists ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        الرقم مسجل بنجاح في واتساب ويملك حساباً نشطاً.
                                    </span>
                                ) : (
                                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {numberStatus.error || 'الرقم غير مسجل في واتساب، قد يفشل الإرسال إليه!'}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Message Body with Spintax Helper */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                                نص الرسالة (يدعم Spintax لمنع الحظر)
                            </label>
                            <button
                                type="button"
                                onClick={previewSpintax}
                                className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                            >
                                <Shuffle className="h-3 w-3" />
                                معاينة تنويع النص
                            </button>
                        </div>
                        <Textarea
                            placeholder="اكتب رسالتك هنا... يمكنك استخدام {مرحباً|أهلاً|السلام عليكم} لتنويع النصوص وتجنب الحظر"
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                setSpintaxPreview(null);
                            }}
                            rows={4}
                            required
                        />
                        {spintaxPreview && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                                <p className="font-semibold text-slate-500 mb-1">معاينة عشوائية للنص المرسل:</p>
                                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{spintaxPreview}</p>
                            </div>
                        )}
                    </div>

                    {/* Media Attachment Upload */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1.5">
                            مرفق اختياري (صورة، ملف PDF، مستند)
                        </label>
                        {mediaFile ? (
                            <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                                <span className="font-medium text-emerald-800 dark:text-emerald-300 truncate max-w-[280px]">
                                    {mediaFile.name} ({(mediaFile.size / 1024).toFixed(1)} KB)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setMediaFile(null)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-[rgb(var(--border))] hover:border-emerald-500 cursor-pointer bg-[rgb(var(--card))] transition-colors text-xs text-[rgb(var(--muted))]">
                                <FileUp className="h-4 w-4 text-emerald-600" />
                                <span>انقر لاختيار ملف أو صورة (الحد الأقصى 16MB)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) setMediaFile(e.target.files[0]);
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || !deviceId || !recipient || !message}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            إرسال الرسالة الآن
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
