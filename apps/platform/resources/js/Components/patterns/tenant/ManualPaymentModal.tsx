import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
    Check,
    Copy,
    Download,
    FileCheck,
    HelpCircle,
    Image as ImageIcon,
    QrCode,
    ShieldAlert,
    Trash2,
    UploadCloud,
    Wallet,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Badge } from '@/Components/ui/Badge';
import { annualPriceMinor, type BillingCycle, type PublicPlan } from '@/Components/patterns/PlanCard';
import { cn } from '@/Lib/cn';

export interface ManualPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: PublicPlan | null;
    billingCycle: BillingCycle;
    onBillingCycleChange: (cycle: BillingCycle) => void;
    onSubmit: (formData: FormData) => void;
    submitting: boolean;
    error: string | null;
}

type PaymentMethodId = 'usdt' | 'shamcash' | 'stcpay';

interface PaymentMethodConfig {
    id: PaymentMethodId;
    name: string;
    badge: string;
    addressOrCode: string;
    accountHolder?: string;
    network?: string;
    instructions: string;
    qrPayload: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
    {
        id: 'usdt',
        name: 'USDT (TRC20)',
        badge: 'عالمي وسريع',
        addressOrCode: 'TJ9f8D2M2pXmN8eS7yQZ5V1bL3k4wU6hRq',
        network: 'TRON (TRC20)',
        instructions: 'أرسل المبلغ بالدولار الرقمي USDT عبر شبكة ترون TRC20 حصرًا لتفادي أي ضياع للرصيد.',
        qrPayload: 'TJ9f8D2M2pXmN8eS7yQZ5V1bL3k4wU6hRq',
    },
    {
        id: 'shamcash',
        name: 'شام كاش / الهرم',
        badge: 'سورية والمجاورة',
        addressOrCode: '963955123456',
        accountHolder: 'مكتب مراسيل لتقنية المعلومات / وسام محمد (دمشق - المرجة)',
        instructions: 'حوّل عبر شام كاش برقم الحساب أعلاه، أو عبر مكتب الهرم / الفؤاد بالاسم المحدد ثم ارفع صورة الإشعار.',
        qrPayload: 'shamcash:963955123456',
    },
    {
        id: 'stcpay',
        name: 'STC Pay / بنكي عربي',
        badge: 'الخليج والدول العربية',
        addressOrCode: 'SA0380000123608010123456',
        accountHolder: 'مراسيل كلاود (هاتف STC Pay: 0501234567)',
        instructions: 'التحويل المباشر عبر STC Pay أو عبر رقم الآيبان المصرفي الموضح.',
        qrPayload: 'SA0380000123608010123456',
    },
];

export function ManualPaymentModal({
    open,
    onOpenChange,
    plan,
    billingCycle,
    onBillingCycleChange,
    onSubmit,
    submitting,
    error,
}: ManualPaymentModalProps) {
    const [selectedMethodId, setSelectedMethodId] = useState<PaymentMethodId>('usdt');
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [paymentReference, setPaymentReference] = useState('');
    const [customerNote, setCustomerNote] = useState('');
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

    const activeMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethodId) ?? PAYMENT_METHODS[0];

    // Calculate final price
    const finalPriceMinor = plan
        ? billingCycle === 'yearly'
            ? (annualPriceMinor(plan) ?? plan.price_minor * 12)
            : plan.price_minor
        : 0;

    const formattedPrice = (finalPriceMinor / 100).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    // Generate QR Code dynamically
    useEffect(() => {
        let isMounted = true;
        QRCode.toDataURL(activeMethod.qrPayload, {
            width: 320,
            margin: 2,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        })
            .then((url) => {
                if (isMounted) setQrDataUrl(url);
            })
            .catch(() => {
                if (isMounted) setQrDataUrl('');
            });

        return () => {
            isMounted = false;
        };
    }, [activeMethod.qrPayload]);

    // Handle Proof Preview
    useEffect(() => {
        if (!paymentProof) {
            setProofPreviewUrl(null);
            return;
        }

        const isImage = paymentProof.type.startsWith('image/');
        if (isImage) {
            const url = URL.createObjectURL(paymentProof);
            setProofPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setProofPreviewUrl(null);
        }
    }, [paymentProof]);

    async function handleCopyCode() {
        try {
            await navigator.clipboard.writeText(activeMethod.addressOrCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    function handleSubmitForm(e: React.FormEvent) {
        e.preventDefault();
        if (!plan) return;

        const formData = new FormData();
        formData.append('plan_id', plan.id);
        formData.append('billing_cycle', billingCycle);
        formData.append('type', 'new');
        formData.append('payment_method', activeMethod.name);
        if (paymentReference.trim()) {
            formData.append('payment_reference', paymentReference.trim());
        }
        if (customerNote.trim()) {
            formData.append('customer_note', customerNote.trim());
        }
        if (paymentProof) {
            formData.append('payment_proof', paymentProof);
        }

        onSubmit(formData);
    }

    if (!plan) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="border-b border-[rgb(var(--border))] pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <DialogTitle className="text-xl font-black text-[rgb(var(--brand-950))]">
                                إتمام الاشتراك والدفع — {plan.name}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-sm text-[rgb(var(--muted))]">
                                اختر وسيلة الدفع، انسخ الكود أو امسح الباركود، ثم ارفع وصل التحويل لتفعيل حسابك.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-[rgb(var(--brand-50))] p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => onBillingCycleChange('monthly')}
                                className={cn(
                                    'rounded-full px-3 py-1 font-semibold transition',
                                    billingCycle === 'monthly'
                                        ? 'bg-[rgb(var(--brand-600))] text-white shadow-sm'
                                        : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
                                )}
                            >
                                شهري
                            </button>
                            <button
                                type="button"
                                onClick={() => onBillingCycleChange('yearly')}
                                className={cn(
                                    'flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition',
                                    billingCycle === 'yearly'
                                        ? 'bg-[rgb(var(--brand-600))] text-white shadow-sm'
                                        : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
                                )}
                            >
                                <span>سنوي</span>
                                <span className="rounded bg-emerald-100 px-1 py-0.2 text-[10px] font-bold text-emerald-800">
                                    -20%
                                </span>
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                {error ? (
                    <div className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Amount Highlight Card */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[rgb(var(--brand-200))] bg-gradient-to-l from-[rgb(var(--brand-50))] to-[rgb(var(--surface))] p-4">
                    <div>
                        <span className="text-xs font-medium text-[rgb(var(--muted))]">المبلغ المستحق للدفع:</span>
                        <div className="flex items-baseline gap-1 text-2xl font-extrabold text-[rgb(var(--brand-900))]">
                            <span>${formattedPrice}</span>
                            <span className="text-xs font-normal text-[rgb(var(--muted))]">
                                {billingCycle === 'yearly' ? 'سنويًا (سنة كاملة)' : 'شهريًا'}
                            </span>
                        </div>
                    </div>
                    <div className="text-end">
                        <Badge tone="brand" className="text-xs">
                            {billingCycle === 'yearly' ? 'خطة سنوية (توفير 20%)' : 'خطة شهرية مرنة'}
                        </Badge>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                            {plan.max_devices} أجهزة · {plan.monthly_message_limit.toLocaleString('en-US')} رسالة
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmitForm} className="mt-5 space-y-5">
                    {/* Step 1: Select Payment Method */}
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                            الخطوة 1: اختر طريقة الدفع المفضلة لديك
                        </label>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {PAYMENT_METHODS.map((method) => {
                                const isSelected = method.id === selectedMethodId;
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setSelectedMethodId(method.id)}
                                        className={cn(
                                            'relative flex flex-col items-start rounded-xl border p-3 text-start transition',
                                            isSelected
                                                ? 'border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50)_/_0.6)] shadow-sm ring-1 ring-[rgb(var(--brand-500))]'
                                                : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--border-strong))]',
                                        )}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className="font-bold text-sm text-[rgb(var(--text))]">
                                                {method.name}
                                            </span>
                                            {isSelected ? (
                                                <Check className="size-4 text-[rgb(var(--brand-600))]" />
                                            ) : null}
                                        </div>
                                        <span className="mt-1 text-caption text-[rgb(var(--muted))]">
                                            {method.badge}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* QR Code & Payment Details Box */}
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] p-4">
                        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                            {/* QR Barcode */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative flex size-36 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-white p-2 shadow-sm">
                                    {qrDataUrl ? (
                                        <img
                                            src={qrDataUrl}
                                            alt="باركود الدفع"
                                            className="size-full object-contain"
                                        />
                                    ) : (
                                        <QrCode className="size-16 text-[rgb(var(--muted))]" />
                                    )}
                                </div>
                                {qrDataUrl ? (
                                    <a
                                        href={qrDataUrl}
                                        download={`payment-qr-${activeMethod.id}.png`}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--brand-700))] hover:underline"
                                    >
                                        <Download className="size-3.5" />
                                        تحميل الباركود
                                    </a>
                                ) : null}
                            </div>

                            {/* Details and Copy */}
                            <div className="flex-1 space-y-2.5 text-center sm:text-start">
                                <div>
                                    <span className="text-xs font-medium text-[rgb(var(--muted))]">
                                        كود / عنوان الدفع ({activeMethod.name}):
                                    </span>
                                    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2 font-mono text-xs text-[rgb(var(--text))]">
                                        <span className="break-all select-all font-semibold" dir="ltr">
                                            {activeMethod.addressOrCode}
                                        </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="shrink-0 h-7 px-2 text-xs"
                                            onClick={() => void handleCopyCode()}
                                        >
                                            {copied ? (
                                                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                    <Check className="size-3.5" /> تم النسخ
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[rgb(var(--brand-700))]">
                                                    <Copy className="size-3.5" /> نسخ الكود
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {activeMethod.accountHolder ? (
                                    <div className="rounded-md bg-[rgb(var(--surface))] p-2 text-xs text-[rgb(var(--text))]">
                                        <span className="text-[rgb(var(--muted))]">المستلم: </span>
                                        <span className="font-semibold">{activeMethod.accountHolder}</span>
                                    </div>
                                ) : null}

                                {activeMethod.network ? (
                                    <div className="text-xs text-[rgb(var(--muted))]">
                                        <span>الشبكة المطلوبة: </span>
                                        <span className="font-bold text-amber-600">{activeMethod.network}</span>
                                    </div>
                                ) : null}

                                <p className="text-xs leading-relaxed text-[rgb(var(--muted))]">
                                    💡 {activeMethod.instructions}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 & 3: Reference & Receipt Proof */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                            الخطوة 2: أدخل بيانات التحويل وارفع إثبات الدفع
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[rgb(var(--text))]">
                                    رقم عملية التحويل / كود الحوالة <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="مثال: رقم إشعار الحوالة أو TxID"
                                    dir="ltr"
                                    required
                                    className="text-xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-[rgb(var(--text))]">
                                    ملاحظات إضافية للإدارة (اختياري)
                                </label>
                                <Input
                                    value={customerNote}
                                    onChange={(e) => setCustomerNote(e.target.value)}
                                    placeholder="أي تفاصيل ترغب بتوضيحها..."
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        {/* File Upload with Live Preview */}
                        <div>
                            <span className="mb-1 block text-xs font-medium text-[rgb(var(--text))]">
                                إرفاق وصل الدفع (صورة الإشعار أو الفاتورة) <span className="text-red-500">*</span>
                            </span>

                            {proofPreviewUrl ? (
                                <div className="relative mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50/50 p-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={proofPreviewUrl}
                                            alt="معاينة وصل الدفع"
                                            className="size-16 rounded-lg object-cover border border-emerald-200 shadow-xs"
                                        />
                                        <div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-900">
                                                <FileCheck className="size-3.5 text-emerald-600" />
                                                <span>تم إرفاق صورة الوصل بنجاح</span>
                                            </div>
                                            <p className="mt-0.5 text-caption text-emerald-700">
                                                {paymentProof?.name} ({(paymentProof?.size ? paymentProof.size / 1024 : 0).toFixed(1)} KB)
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:bg-red-100"
                                        onClick={() => {
                                            setPaymentProof(null);
                                            setProofPreviewUrl(null);
                                        }}
                                    >
                                        <Trash2 className="size-4" />
                                        إزالة
                                    </Button>
                                </div>
                            ) : (
                                <label className="relative mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] p-5 text-center transition hover:border-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-50)_/_0.3)]">
                                    <UploadCloud className="size-8 text-[rgb(var(--brand-600))]" />
                                    <span className="mt-2 text-xs font-bold text-[rgb(var(--text))]">
                                        اضغط لاختيار صورة الوصل أو اسحب الملف إلى هنا
                                    </span>
                                    <span className="mt-1 text-caption text-[rgb(var(--muted))]">
                                        يدعم ملفات JPG, PNG, WebP حتى حجم 5 ميجابايت
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        required
                                        className="sr-only"
                                        onChange={(e) => setPaymentProof(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 border-t border-[rgb(var(--border))] pt-4 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            variant="accent"
                            disabled={submitting || !paymentReference.trim() || !paymentProof}
                            className="sm:min-w-44"
                        >
                            {submitting ? 'جارٍ إرسال الطلب والوصل...' : 'إرسال وصل الدفع للمراجعة'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
