import { Head } from '@inertiajs/react';
import { MoreHorizontal, Settings } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  CodeBlock,
  ConfirmDialog,
  CopyButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormField,
  IconButton,
  Input,
  Label,
  PasswordInput,
  PhoneInput,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Spinner,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipProvider,
} from '@/Components/ui';

function Section({
  title,
  children,
  dir,
}: {
  title: string;
  children: ReactNode;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <section
      dir={dir}
      className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-[var(--shadow-xs)]"
    >
      <h2 className="text-h3 text-[rgb(var(--brand-950))]">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-1">
      <div className={`h-14 rounded-[var(--radius-md)] border border-[rgb(var(--border))] ${className}`} />
      <p className="text-caption text-[rgb(var(--muted))]">{name}</p>
    </div>
  );
}

export default function DesignSystemPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [phone, setPhone] = useState('');
  const [overflowWidth, setOverflowWidth] = useState<number | null>(null);

  return (
    <TooltipProvider>
      <Head title="Design System" />
      <div
        id="design-system-root"
        className="min-h-screen bg-[rgb(var(--canvas))] text-[rgb(var(--text))]"
        dir="rtl"
        lang="ar"
        ref={(node) => {
          if (!node || typeof window === 'undefined') {
            return;
          }
          setOverflowWidth(node.scrollWidth - node.clientWidth);
        }}
      >
        <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 px-4 py-4 md:px-8">
          <p className="text-caption font-semibold text-[rgb(var(--accent-400))]">
            Marasil · Aubergine × Electric Lime · تطوير فقط
          </p>
          <h1 className="text-h1 text-[rgb(var(--brand-950))]">نظام التصميم</h1>
          <p className="mt-1 text-body text-[rgb(var(--muted))]">
            عرض الصفحة متاحة في بيئات local/development فقط.
            {overflowWidth !== null ? (
              <span className="ms-2 font-tabular" data-testid="overflow-delta">
                overflow Δ={overflowWidth}px
              </span>
            ) : null}
          </p>
        </header>

        <main className="mx-auto flex max-w-[var(--content-max-forms)] flex-col gap-8 px-4 py-8 md:px-8">
          <Section title="Palette — Brand (Aubergine)">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              <Swatch name="brand-50" className="bg-brand-50" />
              <Swatch name="brand-100" className="bg-brand-100" />
              <Swatch name="brand-200" className="bg-brand-200" />
              <Swatch name="brand-300" className="bg-brand-300" />
              <Swatch name="brand-400" className="bg-brand-400" />
              <Swatch name="brand-500" className="bg-brand-500" />
              <Swatch name="brand-600" className="bg-brand-600" />
              <Swatch name="brand-700" className="bg-brand-700" />
              <Swatch name="brand-800" className="bg-brand-800" />
              <Swatch name="brand-900" className="bg-brand-900" />
              <Swatch name="brand-950" className="bg-brand-950" />
            </div>
          </Section>

          <Section title="Palette — Accent (Electric Lime)">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              <Swatch name="accent-50" className="bg-accent-50" />
              <Swatch name="accent-100" className="bg-accent-100" />
              <Swatch name="accent-200" className="bg-accent-200" />
              <Swatch name="accent-300" className="bg-accent-300" />
              <Swatch name="accent-400" className="bg-accent-400" />
              <Swatch name="accent-500" className="bg-accent-500" />
              <Swatch name="accent-600" className="bg-accent-600" />
              <Swatch name="accent-700" className="bg-accent-700" />
              <Swatch name="accent-800" className="bg-accent-800" />
              <Swatch name="accent-900" className="bg-accent-900" />
              <Swatch name="accent-950" className="bg-accent-950" />
            </div>
          </Section>

          <Section title="Palette — Warm neutrals">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              <Swatch name="neutral-0" className="bg-neutral-0" />
              <Swatch name="neutral-50" className="bg-neutral-50" />
              <Swatch name="neutral-100" className="bg-neutral-100" />
              <Swatch name="neutral-200" className="bg-neutral-200" />
              <Swatch name="neutral-300" className="bg-neutral-300" />
              <Swatch name="neutral-400" className="bg-neutral-400" />
              <Swatch name="neutral-500" className="bg-neutral-500" />
              <Swatch name="neutral-600" className="bg-neutral-600" />
              <Swatch name="neutral-700" className="bg-neutral-700" />
              <Swatch name="neutral-800" className="bg-neutral-800" />
              <Swatch name="neutral-900" className="bg-neutral-900" />
              <Swatch name="neutral-950" className="bg-neutral-950" />
            </div>
          </Section>

          <Section title="Semantic surfaces & status">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              <Swatch name="canvas" className="bg-canvas" />
              <Swatch name="surface" className="bg-surface" />
              <Swatch name="surface-muted" className="bg-surface-muted" />
              <Swatch name="success-bg" className="bg-success-background" />
              <Swatch name="warning-bg" className="bg-warning-background" />
              <Swatch name="danger-bg" className="bg-danger-background" />
              <Swatch name="info-bg" className="bg-info-background" />
              <Swatch name="pending-bg" className="bg-pending-background" />
              <Swatch name="border" className="bg-border" />
              <Swatch name="border-strong" className="bg-border-strong" />
              <Swatch name="primary alias" className="bg-primary-900" />
              <Swatch name="text-brand" className="bg-text-brand" />
            </div>
          </Section>

          <Section title="Channel & chart colors">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              <Swatch name="channel-whatsapp" className="bg-channel-whatsapp" />
              <Swatch name="channel-telegram" className="bg-channel-telegram" />
              <Swatch name="channel-email" className="bg-channel-email" />
              <Swatch name="channel-sms" className="bg-channel-sms" />
              <Swatch name="channel-webhook" className="bg-channel-webhook" />
              <Swatch name="channel-api" className="bg-channel-api" />
              <Swatch name="chart-1" className="bg-chart-1" />
              <Swatch name="chart-2" className="bg-chart-2" />
              <Swatch name="chart-3" className="bg-chart-3" />
              <Swatch name="chart-4" className="bg-chart-4" />
              <Swatch name="chart-5" className="bg-chart-5" />
              <Swatch name="chart-6" className="bg-chart-6" />
            </div>
          </Section>

          <Section title="Gradients (limited use)">
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className="h-24 rounded-[var(--radius-lg)] border border-[rgb(var(--border))]"
                style={{ background: 'var(--gradient-brand)' }}
              />
              <div
                className="h-24 rounded-[var(--radius-lg)] border border-[rgb(var(--border))]"
                style={{ background: 'var(--gradient-signature)' }}
              />
              <div
                className="h-24 rounded-[var(--radius-lg)] border border-[rgb(var(--border))]"
                style={{ background: 'var(--gradient-soft-bg)' }}
              />
              <div
                className="relative h-24 overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-brand-900"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: 'var(--gradient-accent-glow)' }}
                />
              </div>
            </div>
          </Section>

          <Section title="Typography">
            <p className="text-display">Display 36</p>
            <p className="text-h1">عنوان H1</p>
            <p className="text-h2">عنوان H2</p>
            <p className="text-h3">عنوان H3</p>
            <p className="text-h4">عنوان H4</p>
            <p className="text-body-lg">Body large — نص عربي واضح للقراءة.</p>
            <p className="text-body">Body — النص الافتراضي للوحة التحكم.</p>
            <p className="text-body-sm">Body small — وصف ثانوي.</p>
            <p className="text-label">Label</p>
            <p className="text-caption">Caption</p>
            <p className="text-code font-mono" dir="ltr">
              const key = &apos;mrs_live_…&apos;
            </p>
            <p className="font-tabular text-h2">1,234,567</p>
          </Section>

          <Section title="Radius & shadows">
            <div className="flex flex-wrap gap-4">
              <div className="h-16 w-24 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-surface shadow-[var(--shadow-xs)]" />
              <div className="h-16 w-24 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-surface shadow-[var(--shadow-sm)]" />
              <div className="h-16 w-24 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-surface shadow-[var(--shadow-md)]" />
              <div className="h-16 w-24 rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-surface shadow-[var(--shadow-lg)]" />
              <div className="h-16 w-32 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-surface shadow-[var(--shadow-focus)]" />
            </div>
          </Section>

          <Section title="Buttons — default · hover · disabled · focus">
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="link">Link</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <IconButton label="إعدادات">
                <Settings aria-hidden />
              </IconButton>
            </div>
            <p className="text-caption text-[rgb(var(--muted))]">
              Tab إلى أي زر لمعاينة حلقة التركيز (Electric Lime).
            </p>
          </Section>

          <Section title="Cards">
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-xs)]">
                <h3 className="text-h4 text-[rgb(var(--brand-950))]">بطاقة أساسية</h3>
                <p className="mt-2 text-body-sm text-[rgb(var(--text-muted))]">خلفية Warm Ivory مع حدود ناعمة.</p>
              </article>
              <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface-muted))] p-5">
                <h3 className="text-h4 text-[rgb(var(--text-brand))]">بطاقة مميزة</h3>
                <p className="mt-2 text-body-sm text-[rgb(var(--text-secondary))]">للمحتوى الثانوي أو التلميحات.</p>
              </article>
            </div>
          </Section>

          <Section title="Tables">
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[rgb(var(--border))]">
              <table className="w-full min-w-[320px] text-start text-body-sm">
                <thead className="bg-[rgb(var(--surface-muted))] text-[rgb(var(--text-secondary))]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">الجهاز</th>
                    <th className="px-4 py-3 font-semibold">الحالة</th>
                    <th className="px-4 py-3 font-semibold">الرسائل</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[rgb(var(--border-subtle))] hover:bg-[rgb(var(--surface-hover))]">
                    <td className="px-4 py-3">مبيعات الرياض</td>
                    <td className="px-4 py-3">
                      <StatusBadge status="connected" />
                    </td>
                    <td className="px-4 py-3 font-tabular">1,248</td>
                  </tr>
                  <tr className="border-t border-[rgb(var(--border-subtle))] hover:bg-[rgb(var(--surface-hover))]">
                    <td className="px-4 py-3">دعم العملاء</td>
                    <td className="px-4 py-3">
                      <StatusBadge status="qr_required" />
                    </td>
                    <td className="px-4 py-3 font-tabular">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Forms (RTL)">
            <FormField id="demo-name" label="اسم الجهاز" hint="يظهر للمستخدم داخل اللوحة" required>
              <Input placeholder="جهاز المبيعات" />
            </FormField>
            <FormField id="demo-error" label="حقل بخطأ" error="هذا الحقل مطلوب">
              <Input invalid defaultValue="" />
            </FormField>
            <FormField id="demo-password" label="كلمة المرور">
              <PasswordInput />
            </FormField>
            <FormField id="demo-phone" label="رقم واتساب">
              <PhoneInput id="demo-phone" value={phone} onChange={setPhone} defaultCountry="SY" />
            </FormField>
            <FormField id="demo-notes" label="ملاحظات">
              <Textarea placeholder="نص طويل…" />
            </FormField>
            <div className="flex items-center gap-3">
              <Checkbox
                id="demo-check"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
              <Label htmlFor="demo-check">أوافق على الشروط</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="demo-switch"
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label="تفعيل الإشعارات"
              />
              <Label htmlFor="demo-switch">الإشعارات</Label>
            </div>
            <div className="max-w-xs space-y-2">
              <Label>الخطة</Label>
              <Select defaultValue="basic">
                <SelectTrigger aria-label="اختر خطة">
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section title="Forms (LTR sample)" dir="ltr">
            <FormField id="ltr-email" label="Work email" hint="Latin layout sample">
              <Input type="email" placeholder="ops@example.com" />
            </FormField>
          </Section>

          <Section title="Badges & status">
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">Brand</Badge>
              <Badge tone="accent">API</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="warning">Warning</Badge>
              <Badge tone="danger">Danger</Badge>
              <StatusBadge status="connected" />
              <StatusBadge status="qr_required" />
              <StatusBadge status="failed" />
              <StatusBadge status="queued" />
            </div>
          </Section>

          <Section title="Feedback">
            <Alert tone="info" title="معلومة">
              رسالة معلوماتية.
            </Alert>
            <Alert tone="success" title="نجاح">
              تم الحفظ.
            </Alert>
            <Alert tone="warning" title="تنبيه">
              الاشتراك ينتهي قريبًا.
            </Alert>
            <Alert tone="danger" title="خطأ">
              تعذّر الإرسال.
            </Alert>
            <div className="flex items-center gap-4">
              <Spinner />
              <Progress value={62} aria-label="الاستهلاك" className="max-w-xs" />
              <Skeleton className="h-10 w-40" />
            </div>
          </Section>

          <Section title="Overlay & menus">
            <div className="flex flex-wrap gap-3">
              <Tooltip content="تلميح قصير">
                <Button variant="outline">Tooltip</Button>
              </Tooltip>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>عنوان الحوار</DialogTitle>
                    <DialogDescription>وصف مختصر للحوار.</DialogDescription>
                  </DialogHeader>
                  <Button className="mt-4">حسنًا</Button>
                </DialogContent>
              </Dialog>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                ConfirmDialog
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label="قائمة">
                    <MoreHorizontal aria-hidden />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>تعديل</DropdownMenuItem>
                  <DropdownMenuItem>تفاصيل</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive>حذف</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="تأكيد الحذف؟"
              description="لا يمكن التراجع عن هذا الإجراء."
              onConfirm={() => undefined}
            />
          </Section>

          <Section title="Tabs · Separator · Code">
            <Tabs defaultValue="one">
              <TabsList>
                <TabsTrigger value="one">عام</TabsTrigger>
                <TabsTrigger value="two">تقني</TabsTrigger>
              </TabsList>
              <TabsContent value="one">محتوى عربي RTL.</TabsContent>
              <TabsContent value="two">
                <CodeBlock
                  language="bash"
                  code={`curl -X POST https://api.example.com/v1/messages \\\n  -H "Authorization: Bearer mrs_live_xxx"`}
                />
                <div className="mt-2 flex items-center gap-2" dir="ltr">
                  <code className="text-code">mrs_live_demo_secret</code>
                  <CopyButton value="mrs_live_demo_secret" />
                </div>
              </TabsContent>
            </Tabs>
            <Separator />
          </Section>
        </main>
      </div>
    </TooltipProvider>
  );
}
