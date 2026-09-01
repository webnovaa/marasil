# Component Inventory

## Current state (audit)

| Area | Exists? | Notes |
|------|---------|-------|
| `Components/ui` | ❌ | No shared primitives |
| `Components/patterns` | ❌ | — |
| `Components/feedback` | ❌ | — |
| `DesignSystem/` | ❌ | Tokens inline in `resources/css/app.css` |
| `Layouts/` | Partial | `GuestLayout.tsx` only |
| `Features/` | ❌ | Logic inlined in Pages |
| `Pages/` | Partial | Auth, Public/Home, thin Tenant/Admin shells |
| Icons | ❌ | No Lucide yet |
| Radix / CVA | ❌ | Not installed |

**Existing pages (thin shells):**

- `Pages/Public/Home.tsx`
- `Pages/Auth/{Login,Register,VerifyOtp,ForgotPassword,ResetPassword}.tsx`
- `Pages/Tenant/{Plans,Subscription,Devices,ApiKeys}/…`
- `Pages/Admin/{Users/Pending,SubscriptionRequests}/…`

**Risks:** emerald palette ≈ WhatsApp-adjacent; duplicated button/input classes; no AppShell; no loading/empty/error system; progress color `#059669` in `app.tsx`.

## Target hierarchy

```
resources/js/
├── Components/
│   ├── ui/           # primitives
│   ├── patterns/     # SaaS chrome
│   └── feedback/     # async states
├── DesignSystem/
│   ├── tokens.css
│   ├── typography.css
│   ├── themes.ts
│   ├── brand.tsx
│   └── component-variants.ts
├── Features/{devices,messaging,api-keys,webhooks,subscriptions,billing,profile,security,support,admin}/
├── Layouts/{GuestLayout,AuthLayout,TenantLayout,AdminLayout,DocsLayout}.tsx
└── Pages/{Public,Auth,Tenant,Admin,Docs}/
```

## UI primitives (Phase 1)

Button, IconButton, LinkButton, Input, PasswordInput, PhoneInput, Textarea, Select, Combobox, MultiSelect, Checkbox, RadioGroup, Switch, DatePicker, DateRangePicker, FileUpload, Label, FormField, FieldError, InputHint, Badge, Avatar, Tooltip, Popover, DropdownMenu, CommandMenu, Tabs, Accordion, Separator, Breadcrumb, Pagination, Skeleton, Progress, Spinner, Alert, Toast, Dialog, ConfirmDialog, Drawer, Sheet, Table, CodeBlock, CopyButton.

Stack: **Radix + CVA + Lucide** + project tokens (no default library look).

## Patterns (Phase 2)

AppShell, AppSidebar, SidebarSection, Topbar, PageHeader, PageActions, ContentSection, StatCard, MetricTrend, ChartCard, DataTable (+ Toolbar), FilterBar, SearchInput, StatusBadge, StatusDot, Timeline, ActivityItem, UsageMeter, PlanCard, PriceDisplay, FeatureList, QuotaIndicator, DetailList, KeyValueRow, DangerZone, SettingsNav, NotificationItem, UserMenu, HelpMenu, MobileNavigation.

## Feedback (Phase 1–2)

PageSkeleton, TableSkeleton, CardSkeleton, EmptyState, ErrorState, InlineError, PermissionDenied, SubscriptionRequired, OfflineBanner, MaintenanceBanner, ConnectionLostBanner.

## Feature components (Phases 3–5)

See prompt §9 — Devices, Messaging, API keys, Webhooks, Subscriptions/Billing, Admin. Built only after foundation + layouts.

## Extraction rule

Extract when repeated ≥2×, complex a11y/behavior, clear pattern, or needs isolated tests. Prefer composition over 30-prop mega-components.

## Migration plan (do not big-bang)

1. Add tokens + map old `primary-*` → `brand-*` aliases temporarily.
2. Build ui/ + showcase route (dev only).
3. Introduce Tenant/Admin shells; wrap existing pages without rewriting business logic.
4. Replace inline forms with FormField/Button page-by-page.
5. Grow Feature folders as pages deepen.
6. Visual regression snapshots at 390 / 768 / 1440 before deleting GuestLayout glow.
