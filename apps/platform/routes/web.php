<?php

declare(strict_types=1);

use App\Http\Controllers\Web\Admin\AdminDashboardPageController;
use App\Http\Controllers\Web\Admin\AuditPageController;
use App\Http\Controllers\Web\Admin\BroadcastController;
use App\Http\Controllers\Web\Admin\HealthPageController;
use App\Http\Controllers\Web\Admin\PlatformWhatsAppPageController;
use App\Http\Controllers\Web\Admin\PendingUsersPageController;
use App\Http\Controllers\Web\Admin\PlansPageController as AdminPlansPageController;
use App\Http\Controllers\Web\Admin\SubscriptionRequestsPageController;
use App\Http\Controllers\Web\Admin\SubscriptionsPageController;
use App\Http\Controllers\Web\Admin\SupportTicketShowPageController as AdminSupportTicketShowPageController;
use App\Http\Controllers\Web\Admin\SupportTicketsPageController;
use App\Http\Controllers\Web\Admin\TenantsPageController;
use App\Http\Controllers\Web\Admin\UsersPageController;
use App\Http\Controllers\Web\Auth\AuthPageController;
use App\Http\Controllers\Web\Auth\LogoutController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\LocaleController;
use App\Http\Controllers\Web\Public\ContactPageController;
use App\Http\Controllers\Web\Public\DocsPageController;
use App\Http\Controllers\Web\Public\FaqPageController;
use App\Http\Controllers\Web\Public\HomePageController;
use App\Http\Controllers\Web\Public\LegalPageController;
use App\Http\Controllers\Web\Public\PricingPageController;
use App\Http\Controllers\Web\Public\StatusPageController;
use App\Http\Controllers\Web\Tenant\AiAssistantController;
use App\Http\Controllers\Web\Tenant\AnalyticsController;
use App\Http\Controllers\Web\Tenant\AutoRepliesController;
use App\Http\Controllers\Web\Tenant\BillingPageController;
use App\Http\Controllers\Web\Tenant\BillingShowPageController;
use App\Http\Controllers\Web\Tenant\CampaignsController;
use App\Http\Controllers\Web\Tenant\ChatController;
use App\Http\Controllers\Web\Tenant\ContactsController;
use App\Http\Controllers\Web\Tenant\IntegrationsController;
use App\Http\Controllers\Web\Tenant\WidgetController;
use App\Http\Controllers\Web\Tenant\DashboardPageController;
use App\Http\Controllers\Web\Tenant\DevicesPageController;
use App\Http\Controllers\Web\Tenant\MessagesPageController;
use App\Http\Controllers\Web\Tenant\MessagesShowPageController;
use App\Http\Controllers\Web\Tenant\NotificationsPageController;
use App\Http\Controllers\Web\Tenant\PlansPageController;
use App\Http\Controllers\Web\Tenant\ProfilePageController;
use App\Http\Controllers\Web\Tenant\QuickSendMessageController;
use App\Http\Controllers\Web\Tenant\SubscribePlanController;
use App\Http\Controllers\Web\Tenant\SubscriptionPageController;
use App\Http\Controllers\Web\Tenant\SupportPageController;
use App\Http\Controllers\Web\Tenant\SupportTicketShowPageController as TenantSupportTicketShowPageController;
use App\Http\Controllers\Web\Tenant\UsagePageController;
use App\Http\Controllers\Web\Tenant\WebhooksPageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', HomePageController::class)->name('home');
Route::get('/pricing', PricingPageController::class)->name('pricing');
Route::get('/status', StatusPageController::class)->name('status');
Route::get('/docs', DocsPageController::class)->name('docs');
Route::get('/faq', FaqPageController::class)->name('faq');
Route::get('/contact', ContactPageController::class)->name('contact');
Route::get('/legal/terms', [LegalPageController::class, 'terms'])->name('legal.terms');
Route::get('/legal/privacy', [LegalPageController::class, 'privacy'])->name('legal.privacy');
Route::get('/legal/acceptable-use', [LegalPageController::class, 'acceptableUse'])->name('legal.acceptable-use');
Route::post('/locale', LocaleController::class)->name('locale.update');

if (app()->environment(['local', 'development', 'testing'])) {
    Route::get('/dev/design-system', function () {
        return Inertia::render('Dev/DesignSystem');
    })->name('dev.design-system');
}

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthPageController::class, 'login'])->name('login');
    Route::get('/register', [AuthPageController::class, 'register'])->name('register');
    Route::get('/verify-otp', [AuthPageController::class, 'verifyOtp'])->name('verify-otp');
    Route::get('/forgot-password', [AuthPageController::class, 'forgotPassword'])->name('password.request');
    Route::get('/reset-password', [AuthPageController::class, 'resetPassword'])->name('password.reset');
});

Route::middleware(['auth', 'verified.phone'])->group(function (): void {
    Route::post('/logout', LogoutController::class)->name('logout');
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::middleware('tenant.area')->group(function (): void {
        Route::get('/plans', PlansPageController::class)->name('tenant.plans');
        Route::post('/plans/subscribe', SubscribePlanController::class)->name('tenant.plans.subscribe');
        Route::get('/subscription', SubscriptionPageController::class)->name('tenant.subscription');

        Route::middleware('subscription.active')->group(function (): void {
            Route::get('/tenant', DashboardPageController::class)->name('tenant.dashboard');
            Route::get('/devices', [DevicesPageController::class, 'index'])->name('devices.index');
            Route::get('/devices/{deviceUlid}', [DevicesPageController::class, 'show'])->name('devices.show');
            Route::redirect('/api-keys', '/devices');
            Route::get('/webhooks', WebhooksPageController::class)->name('webhooks.index');
            Route::get('/messages', MessagesPageController::class)->name('messages.index');
            Route::post('/messages/quick', QuickSendMessageController::class)->name('messages.quick');
            Route::get('/messages/{messageUlid}', MessagesShowPageController::class)->name('messages.show');

            // Contacts & Groups
            Route::get('/contacts', [ContactsController::class, 'index'])->name('contacts.index');
            Route::post('/contacts', [ContactsController::class, 'store'])->name('contacts.store');
            Route::post('/contacts/groups', [ContactsController::class, 'storeGroup'])->name('contacts.groups.store');
            Route::post('/contacts/import', [ContactsController::class, 'import'])->name('contacts.import');
            Route::delete('/contacts/{contact}', [ContactsController::class, 'destroy'])->name('contacts.destroy');

            // Auto-Replies
            Route::get('/auto-replies', [AutoRepliesController::class, 'index'])->name('auto-replies.index');
            Route::post('/auto-replies', [AutoRepliesController::class, 'store'])->name('auto-replies.store');
            Route::post('/auto-replies/{autoReply}/toggle', [AutoRepliesController::class, 'toggle'])->name('auto-replies.toggle');
            Route::delete('/auto-replies/{autoReply}', [AutoRepliesController::class, 'destroy'])->name('auto-replies.destroy');

            // Campaigns
            Route::get('/campaigns', [CampaignsController::class, 'index'])->name('campaigns.index');
            Route::get('/campaigns/create', [CampaignsController::class, 'create'])->name('campaigns.create');
            Route::post('/campaigns', [CampaignsController::class, 'store'])->name('campaigns.store');
            Route::get('/campaigns/{campaign}', [CampaignsController::class, 'show'])->name('campaigns.show');
            Route::post('/campaigns/{campaign}/pause', [CampaignsController::class, 'pause'])->name('campaigns.pause');
            Route::post('/campaigns/{campaign}/resume', [CampaignsController::class, 'resume'])->name('campaigns.resume');

            // AI WhatsApp Assistant (Google Gemini)
            Route::get('/ai-assistant', [AiAssistantController::class, 'index'])->name('ai-assistant.index');
            Route::post('/ai-assistant', [AiAssistantController::class, 'update'])->name('ai-assistant.update');
            Route::post('/ai-assistant/test', [AiAssistantController::class, 'test'])->name('ai-assistant.test');

            // WhatsApp Web Live Chat Helpdesk
            Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
            Route::get('/chat/messages', [ChatController::class, 'messages'])->name('chat.messages');
            Route::post('/chat/send', [ChatController::class, 'send'])->name('chat.send');

            // E-Commerce Integrations Hub
            Route::get('/integrations', [IntegrationsController::class, 'index'])->name('integrations.index');
            Route::post('/integrations/simulate', [IntegrationsController::class, 'simulate'])->name('integrations.simulate');

            // Floating WhatsApp Widget
            Route::get('/widget', [WidgetController::class, 'index'])->name('widget.index');
            Route::post('/widget', [WidgetController::class, 'update'])->name('widget.update');

            // Advanced Analytics & 24h Heatmap
            Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

            Route::get('/usage', UsagePageController::class)->name('usage.index');
            Route::get('/billing', BillingPageController::class)->name('billing.index');
            Route::get('/billing/{invoiceUlid}', BillingShowPageController::class)->name('billing.show');
            Route::get('/support', SupportPageController::class)->name('support.index');
            Route::post('/support', [SupportPageController::class, 'store'])->name('support.store');
            Route::get('/support/{ticketUlid}', TenantSupportTicketShowPageController::class)->name('support.show');
            Route::post('/support/{ticketUlid}/reply', [TenantSupportTicketShowPageController::class, 'reply'])->name('support.reply');
            Route::post('/support/{ticketUlid}/close', [TenantSupportTicketShowPageController::class, 'close'])->name('support.close');
        });

        Route::get('/notifications', [NotificationsPageController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/read-all', [NotificationsPageController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('/notifications/{ulid}/read', [NotificationsPageController::class, 'markRead'])->name('notifications.read');
        Route::post('/notifications/preferences', [NotificationsPageController::class, 'updatePreferences'])->name('notifications.preferences');
        Route::get('/profile', ProfilePageController::class)->name('profile.index');
        Route::post('/profile', [ProfilePageController::class, 'update'])->name('profile.update');
        Route::post('/profile/password', [ProfilePageController::class, 'changePassword'])->name('profile.password');
        Route::post('/profile/phone/request', [ProfilePageController::class, 'requestPhoneChange'])->name('profile.phone.request');
        Route::post('/profile/phone/confirm', [ProfilePageController::class, 'confirmPhoneChange'])->name('profile.phone.confirm');
        Route::post('/profile/phone/resend', [ProfilePageController::class, 'resendPhoneChangeOtp'])->name('profile.phone.resend');
        Route::post('/profile/phone/cancel', [ProfilePageController::class, 'cancelPhoneChange'])->name('profile.phone.cancel');
        Route::delete('/profile/sessions/{sessionUlid}', [ProfilePageController::class, 'revokeSession'])->name('profile.sessions.revoke');
        Route::post('/profile/sessions/revoke-others', [ProfilePageController::class, 'revokeOtherSessions'])->name('profile.sessions.revoke-others');
    });

    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function (): void {
        Route::get('/', AdminDashboardPageController::class)->name('dashboard');
        Route::get('/users', UsersPageController::class)->name('users.index');
        Route::get('/users/pending', PendingUsersPageController::class)->name('users.pending');
        Route::get('/tenants', TenantsPageController::class)->name('tenants.index');
        Route::get('/subscription-requests', SubscriptionRequestsPageController::class)
            ->name('subscription-requests');
        Route::get('/subscriptions', SubscriptionsPageController::class)->name('subscriptions.index');
        Route::get('/plans', AdminPlansPageController::class)->name('plans');
        Route::get('/health', HealthPageController::class)->name('health');
        Route::get('/platform-whatsapp', PlatformWhatsAppPageController::class)->name('platform-whatsapp');
        Route::get('/audit', AuditPageController::class)->name('audit');
        Route::get('/support', SupportTicketsPageController::class)->name('support');
        Route::get('/support/{ticketUlid}', AdminSupportTicketShowPageController::class)->name('support.show');
        Route::get('/broadcast', [BroadcastController::class, 'index'])->name('broadcast.index');
        Route::post('/broadcast', [BroadcastController::class, 'store'])->name('broadcast.store');
        Route::post('/ai/toggle', [\App\Http\Controllers\Web\Admin\AdminAiController::class, 'toggle'])->name('ai.toggle');
    });
});
