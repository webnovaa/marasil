import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { 
    Users, 
    UserPlus, 
    FolderPlus, 
    Upload, 
    Search, 
    Trash2, 
    CheckCircle2, 
    MessageSquare,
    Tag,
    Phone
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantPagination } from '@/Components/patterns/tenant/TenantPagination';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Group = {
    id: number;
    ulid: string;
    name: string;
    color: string;
    description: string | null;
    contacts_count?: number;
};

type Contact = {
    id: number;
    ulid: string;
    name: string;
    phone_e164: string;
    is_whatsapp_verified: boolean;
    notes: string | null;
    group: Group | null;
    created_at: string;
};

type Props = {
    contacts: Contact[];
    groups: Group[];
    filters: { search: string; group_id: string | null };
    pagination: { current_page: number; last_page: number; per_page: number; total: number } | null;
};

export default function ContactsIndex({ contacts, groups, filters, pagination }: Props) {
    const { formatDate } = useI18n();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(filters.group_id);

    // Modals
    const [addContactOpen, setAddContactOpen] = useState(false);
    const [addGroupOpen, setAddGroupOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    // Forms
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactGroupId, setContactGroupId] = useState('');
    const [contactNotes, setContactNotes] = useState('');

    const [groupName, setGroupName] = useState('');
    const [groupColor, setGroupColor] = useState('#10b981');
    const [groupDesc, setGroupDesc] = useState('');

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importGroupId, setImportGroupId] = useState('');

    function handleFilter(groupId: string | null = selectedGroup, term: string = search) {
        router.get('/contacts', {
            search: term,
            group_id: groupId || undefined,
        }, { preserveState: true });
    }

    function handleAddContact(e: FormEvent) {
        e.preventDefault();
        router.post('/contacts', {
            name: contactName,
            phone: contactPhone,
            group_id: contactGroupId || null,
            notes: contactNotes || null,
        }, {
            onSuccess: () => {
                setAddContactOpen(false);
                setContactName('');
                setContactPhone('');
                setContactNotes('');
            },
        });
    }

    function handleAddGroup(e: FormEvent) {
        e.preventDefault();
        router.post('/contacts/groups', {
            name: groupName,
            color: groupColor,
            description: groupDesc || null,
        }, {
            onSuccess: () => {
                setAddGroupOpen(false);
                setGroupName('');
                setGroupDesc('');
            },
        });
    }

    function handleImport(e: FormEvent) {
        e.preventDefault();
        if (!csvFile) return;
        const formData = new FormData();
        formData.append('file', csvFile);
        if (importGroupId) formData.append('group_id', importGroupId);

        router.post('/contacts/import', formData, {
            onSuccess: () => {
                setImportOpen(false);
                setCsvFile(null);
            },
        });
    }

    function handleDeleteContact(contactUlid: string) {
        if (confirm('هل أنت متأكد من رغبتك في حذف جهة الاتصال هذه؟')) {
            router.delete(`/contacts/${contactUlid}`);
        }
    }

    return (
        <TenantShell
            title="جهات الاتصال والمجموعات"
            description="إدارة أرقام العملاء، تصنيفهم بمجموعات، واستيراد القوائم عبر ملفات Excel و CSV"
            headerActions={
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
                        <Upload className="h-4 w-4" />
                        استيراد CSV
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setAddGroupOpen(true)} className="gap-1.5">
                        <FolderPlus className="h-4 w-4" />
                        مجموعة جديدة
                    </Button>
                    <Button size="sm" onClick={() => setAddContactOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <UserPlus className="h-4 w-4" />
                        إضافة جهة اتصال
                    </Button>
                </div>
            }
        >
            {/* Filter Pills & Search */}
            <div className="mb-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative min-w-[240px] flex-1 max-w-md">
                        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                        <Input
                            className="ps-9"
                            placeholder="بحث بالاسم أو رقم الهاتف..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter(selectedGroup, e.target.value);
                            }}
                            dir="ltr"
                        />
                    </div>

                    {/* Group Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedGroup(null);
                                handleFilter(null);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                selectedGroup === null
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:border-emerald-500'
                            }`}
                        >
                            الكل ({pagination?.total ?? contacts.length})
                        </button>
                        {groups.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                    const next = selectedGroup === String(g.id) ? null : String(g.id);
                                    setSelectedGroup(next);
                                    handleFilter(next);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                                    selectedGroup === String(g.id)
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:border-emerald-500'
                                }`}
                            >
                                <span className="size-2 rounded-full" style={{ backgroundColor: g.color }} />
                                {g.name} ({g.contacts_count ?? 0})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contacts Table */}
            <TenantPanel title={`سجل جهات الاتصال (${pagination?.total ?? contacts.length})`} flush>
                {contacts.length === 0 ? (
                    <TenantEmptyState
                        icon={Users}
                        title="لا توجد جهات اتصال حتى الآن"
                        description="ابدأ بإضافة عميل جديد أو استيراد قائمة أرقام من ملف CSV بنقرة واحدة."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-[rgb(var(--muted))]/5 border-b border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--muted))] uppercase">
                                <tr>
                                    <th className="px-4 py-3">الاسم</th>
                                    <th className="px-4 py-3">رقم الهاتف</th>
                                    <th className="px-4 py-3">المجموعة</th>
                                    <th className="px-4 py-3">حالة الواتساب</th>
                                    <th className="px-4 py-3">تاريخ الإضافة</th>
                                    <th className="px-4 py-3 text-end">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgb(var(--border))]">
                                {contacts.map((c) => (
                                    <tr key={c.ulid} className="hover:bg-[rgb(var(--muted))]/5 transition-colors">
                                        <td className="px-4 py-3.5 font-medium">
                                            {c.name}
                                            {c.notes && <p className="text-xs text-[rgb(var(--muted))] line-clamp-1">{c.notes}</p>}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs text-[rgb(var(--muted))]" dir="ltr">
                                            {c.phone_e164}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {c.group ? (
                                                <span
                                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                    style={{ backgroundColor: `${c.group.color}15`, color: c.group.color }}
                                                >
                                                    <Tag className="h-3 w-3" />
                                                    {c.group.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[rgb(var(--muted))]">عام</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {c.is_whatsapp_verified ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    نشط بواتساب
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[rgb(var(--muted))]">غير مفحوص</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--muted))]">
                                            {formatDate(c.created_at)}
                                        </td>
                                        <td className="px-4 py-3.5 text-end">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteContact(c.ulid)}
                                                className="p-1.5 text-[rgb(var(--muted))] hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="p-4">
                    <TenantPagination pagination={pagination} />
                </div>
            </TenantPanel>

            {/* Modal: Add Contact */}
            <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-emerald-600" />
                            إضافة جهة اتصال جديدة
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddContact} className="space-y-4 mt-2">
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">الاسم الكامل</label>
                            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="مثال: يوسف محمد" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">رقم الهاتف الدولي</label>
                            <Input dir="ltr" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+966500000000" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">المجموعة</label>
                            <select
                                value={contactGroupId}
                                onChange={(e) => setContactGroupId(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                                <option value="">بدون مجموعة (عام)</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">ملاحظات إضافية</label>
                            <Input value={contactNotes} onChange={(e) => setContactNotes(e.target.value)} placeholder="مثال: طلب مخصص / عميل قديم" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setAddContactOpen(false)}>إلغاء</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">حفظ العميل</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Add Group */}
            <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderPlus className="h-5 w-5 text-emerald-600" />
                            إنشاء مجموعة جديدة
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddGroup} className="space-y-4 mt-2">
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">اسم المجموعة</label>
                            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="مثال: كبار العملاء VIP" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">لون التمييز</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={groupColor} onChange={(e) => setGroupColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border" />
                                <span className="font-mono text-xs">{groupColor}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">الوصف</label>
                            <Input value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} placeholder="وصف اختياري للمجموعة" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setAddGroupOpen(false)}>إلغاء</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">إنشاء المجموعة</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Import CSV */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-emerald-600" />
                            استيراد جهات الاتصال من ملف CSV
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleImport} className="space-y-4 mt-2">
                        <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">
                            يجب أن يحتوي ملف CSV على عمودين: العمود الأول <strong>الاسم</strong>، والعمود الثاني <strong>رقم الهاتف</strong> (مع المفتاح الدولي).
                        </p>
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">المجموعة المستهدفة</label>
                            <select
                                value={importGroupId}
                                onChange={(e) => setImportGroupId(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm"
                            >
                                <option value="">بدون مجموعة (عام)</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">ملف CSV</label>
                            <Input
                                type="file"
                                accept=".csv,.txt"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setImportOpen(false)}>إلغاء</Button>
                            <Button type="submit" disabled={!csvFile} className="bg-emerald-600 hover:bg-emerald-700 text-white">بدء الاستيراد</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </TenantShell>
    );
}
