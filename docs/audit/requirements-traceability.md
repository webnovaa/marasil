# Requirements Traceability — Marasil V1

| Requirement | Implementation | Evidence |
|---|---|---|
| API key prefix `mrs_live_` / `mrs_test_` | `ApiKeyPrefix` | `DevicesAndMessagingTest` |
| Atomic message quota + idempotency | `UsageMeter`, `PersistAcceptedMessage` | `QuotaAndOutboxTest` |
| Transactional outbox | `outbox_messages`, `ProcessOutboxMessage`, `outbox:publish` | `QuotaAndOutboxTest` |
| Plan limits (devices/keys/webhooks) | `PlanLimitGuard` | `QuotaAndOutboxTest::test_device_limit_is_enforced` |
| API key abilities | `EnsureApiKeyAbility` middleware | `QuotaAndOutboxTest::test_api_key_ability_is_enforced` |
| Tenant RBAC permissions | `RolesAndPermissionsSeeder` tenant.* | Seeder + `CreateTenantForOwner` role sync |
| Subscription states | `SubscriptionStatus` enum + `ReconcileSubscriptions` | `SubscriptionGateTest` |
| Consent/suppression | `MessageAdmissionService` | `QuotaAndOutboxTest::test_suppressed_recipient_is_rejected` |
| Notifications in-app | `NotificationService`, notifications pages | `NotificationsAndTemplatesTest` |
| Templates immutable versions | `TemplateRenderer`, `TemplatesPageController` | `NotificationsAndTemplatesTest` |
| Security headers | `SecurityHeaders` middleware | `bootstrap/app.php` |
| Horizon auth | `config/horizon.php` | manual config |
| i18n ar/en | `lang/ar`, `lang/en`, `SetLocale`, `LanguageSwitcher` | locale routes + shared props |
| CI gates | `.github/workflows/ci.yml` | GitHub Actions |
| Backups drill | `backup:run` command | `BackupDatabase` command |
