# Page Map & Sitemap

## Sitemap

```mermaid
flowchart TB
  subgraph Public
    Home[/]
    Pricing[/pricing]
    FAQ[/faq]
    Docs[/docs]
    Status[/status]
    Legal[/legal/*]
  end

  subgraph Auth
    Login[/login]
    Register[/register]
    OTP[/verify-otp]
    Pending[/pending-approval]
    Rejected[/account-rejected]
    Forgot[/forgot-password]
    Reset[/reset-password]
  end

  subgraph Tenant
    Dash[/app]
    Devices[/devices]
    DeviceShow[/devices/:id]
    Messages[/messages]
    SendTest[/messages/test]
    ApiKeys[/api-keys]
    Webhooks[/webhooks]
    Usage[/usage]
    Billing[/subscription]
    Plans[/plans]
    Profile[/settings/*]
    Support[/support]
  end

  subgraph Admin
    ADash[/admin]
    Approvals[/admin/users/pending]
    Users[/admin/users]
    SubReqs[/admin/subscription-requests]
    Subs[/admin/subscriptions]
    APlans[/admin/plans]
    Payments[/admin/payments]
    ADevices[/admin/devices]
    AMessages[/admin/messages]
    AWebhooks[/admin/webhooks-failed]
    Audit[/admin/audit]
    Health[/admin/system-health]
    ASettings[/admin/settings]
  end

  Home --> Login
  Home --> Register
  Register --> OTP --> Pending --> Dash
  Login --> Dash
  Dash --> Devices
  Login --> ADash
```

## Existing vs planned

| Route / Page | Status now | Target layout | States required |
|--------------|------------|---------------|-----------------|
| `/` Home | Exists (hero only) | Guest → Public | — |
| `/login` … reset | Exists (basic forms) | Auth split | loading/error |
| `/plans` | Shell | Tenant | empty/error |
| `/subscription` | Shell | Tenant | expired/grace |
| `/devices` `/devices/:id` | Shell + QR placeholder | Tenant | qr/connected/error |
| `/api-keys` | Shell | Tenant | secret reveal |
| `/admin/users/pending` | Shell | Admin | empty queue |
| `/admin/subscription-requests` | Shell | Admin | approve/reject |
| Tenant dashboard | ❌ | Tenant | onboarding empty |
| Messages / Webhooks / Usage | ❌ or API only | Tenant | full async states |
| Landing full sections | ❌ | Public | — |
| Docs | ❌ | Docs | — |
| Design System showcase | ❌ | Dev | all variants |

## Tenant navigation (target)

نظرة عامة · الأجهزة · الرسائل · إرسال تجريبي · مفاتيح API · Webhooks · الاستهلاك · الاشتراك والفواتير · التوثيق · الدعم · الإشعارات · الملف الشخصي · الأمان

## Admin navigation (target)

نظرة عامة · طلبات الحسابات · المستخدمون · طلبات الاشتراك · الاشتراكات · الخطط · المدفوعات · الأجهزة · الرسائل · Webhooks الفاشلة · الدعم · الإعلانات · التدقيق · الأمن · صحة النظام · الإعدادات

## Per-page state checklist (minimum)

Every authenticated page: **loading · empty · error · permission · subscription gate · success**.  
Devices additionally: disconnected / qr_required / suspended.  
Messaging: quota reached.  
Billing: expired / grace.
