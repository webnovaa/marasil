<?php

declare(strict_types=1);

use App\Http\Controllers\Web\Admin\AdminDashboardPageController;
use App\Http\Controllers\Web\Admin\AuditPageController;
use App\Http\Controllers\Web\Admin\HealthPageController;
use App\Http\Controllers\Web\Admin\PendingUsersPageController;
use App\Http\Controllers\Web\Admin\PlansPageController as AdminPlansPageController;
use App\Http\Controllers\Web\Admin\SubscriptionRequestsPageController;
use App\Http\Controllers\Web\Admin\SubscriptionsPageController;
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
use App\Http\Controllers\Web\Tenant\ApiKeysPageController;
use App\Http\Controllers\Web\Tenant\BillingPageController;
use App\Http\Controllers\Web\Tenant\DashboardPageController;
use App\Http\Controllers\Web\Tenant\DevicesPageController;
use App\Http\Controllers\Web\Tenant\MessagesPageController;
use App\Http\Controllers\Web\Tenant\NotificationsPageController;
use App\Http\Controllers\Web\Tenant\PlansPageController;
use App\Http\Controllers\Web\Tenant\ProfilePageController;
use App\Http\Controllers\Web\Tenant\SubscribePlanController;
use App\Http\Controllers\Web\Tenant\SubscriptionPageController;
use App\Http\Controllers\Web\Tenant\SupportPageController;
use App\Http\Controllers\Web\Tenant\TeamPageController;
use App\Http\Controllers\Web\Tenant\TemplatesPageController;
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
            Route::get('/api-keys', ApiKeysPageController::class)->name('api-keys.index');
            Route::get('/webhooks', WebhooksPageController::class)->name('webhooks.index');
            Route::get('/messages', MessagesPageController::class)->name('messages.index');
            Route::get('/usage', UsagePageController::class)->name('usage.index');
            Route::get('/billing', BillingPageController::class)->name('billing.index');
            Route::get('/templates', TemplatesPageController::class)->name('templates.index');
            Route::post('/templates', [TemplatesPageController::class, 'store'])->name('templates.store');
            Route::get('/team', TeamPageController::class)->name('team.index');
            Route::post('/team/invites', [TeamPageController::class, 'invite'])->name('team.invite');
            Route::get('/support', SupportPageController::class)->name('support.index');
            Route::post('/support', [SupportPageController::class, 'store'])->name('support.store');
        });

        Route::get('/notifications', [NotificationsPageController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/read-all', [NotificationsPageController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('/notifications/{ulid}/read', [NotificationsPageController::class, 'markRead'])->name('notifications.read');
        Route::post('/notifications/preferences', [NotificationsPageController::class, 'updatePreferences'])->name('notifications.preferences');
        Route::get('/profile', ProfilePageController::class)->name('profile.index');
        Route::post('/profile', [ProfilePageController::class, 'update'])->name('profile.update');
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
        Route::get('/audit', AuditPageController::class)->name('audit');
        Route::get('/support', SupportTicketsPageController::class)->name('support');
    });
});
