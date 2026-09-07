<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Admin\V1\AdminUsersIndexController;
use App\Http\Controllers\Api\Admin\V1\PlansController as AdminPlansController;
use App\Http\Controllers\Api\Admin\V1\PlatformWhatsAppController;
use App\Http\Controllers\Api\Admin\V1\SubscriptionsController as AdminSubscriptionsController;
use App\Http\Controllers\Api\Admin\V1\SupportTicketsController as AdminSupportTicketsController;
use App\Http\Controllers\Api\Admin\V1\TenantsController as AdminTenantsController;
use App\Http\Controllers\Api\Admin\V1\SubscriptionRequestsController as AdminSubscriptionRequestsController;
use App\Http\Controllers\Api\Admin\V1\UsersController as AdminUsersController;
use App\Http\Controllers\Api\Internal\V1\WhatsAppEventsController;
use App\Http\Controllers\Api\V1\ApiKeysController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\DevicesController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\MessagesController;
use App\Http\Controllers\Api\V1\PlansController;
use App\Http\Controllers\Api\V1\SubscriptionRequestsController;
use App\Http\Controllers\Api\V1\SubscriptionShowController;
use App\Http\Controllers\Api\V1\TenantShowController;
use App\Http\Controllers\Api\V1\WebhooksController;
use App\Http\Middleware\AuthenticateApiKey;
use App\Http\Middleware\EnsureActiveSubscription;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureApiKeyAbility;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\VerifyInternalHmac;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class)->name('api.v1.health');

Route::prefix('v1')->group(function (): void {
    Route::get('plans', [PlansController::class, 'index']);

    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
        Route::post('verify-phone', [AuthController::class, 'verifyPhone'])->middleware('throttle:20,1');
        Route::post('resend-otp', [AuthController::class, 'resendOtp'])->middleware('throttle:5,1');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });

    Route::middleware(['auth:sanctum'])->group(function (): void {
        Route::get('me', MeController::class);
        Route::get('tenant', TenantShowController::class)->middleware(EnsureUserIsActive::class);

        Route::middleware([EnsureUserIsActive::class])->group(function (): void {
            Route::get('subscription-requests', [SubscriptionRequestsController::class, 'index']);
            Route::post('subscription-requests', [SubscriptionRequestsController::class, 'store']);
            Route::get('subscription', [SubscriptionShowController::class, 'show']);
            Route::post('subscription/renewal-request', [SubscriptionShowController::class, 'renewalRequest']);
        });
    });

    Route::middleware(['auth:sanctum', EnsureUserIsActive::class, EnsureActiveSubscription::class])->group(function (): void {
        Route::get('devices', [DevicesController::class, 'index']);
        Route::post('devices', [DevicesController::class, 'store']);
        Route::get('devices/{device}', [DevicesController::class, 'show']);
        Route::patch('devices/{device}', [DevicesController::class, 'update']);
        Route::delete('devices/{device}', [DevicesController::class, 'destroy']);
        Route::post('devices/{device}/rotate-api-key', [DevicesController::class, 'rotateIntegrationKey']);
        Route::post('devices/{device}/connect', [DevicesController::class, 'connect']);
        Route::post('devices/{device}/disconnect', [DevicesController::class, 'disconnect']);
        Route::post('devices/{device}/logout', [DevicesController::class, 'logout']);
        Route::post('devices/{device}/test-message', [DevicesController::class, 'testMessage']);
        Route::post('devices/{device}/socket-token', [DevicesController::class, 'socketToken'])->middleware('throttle:20,1');

        Route::get('api-keys', [ApiKeysController::class, 'index']);
        Route::delete('api-keys/{apiKey}', [ApiKeysController::class, 'destroy']);
        Route::post('api-keys/{apiKey}/rotate', [ApiKeysController::class, 'rotate']);

        Route::get('webhooks', [WebhooksController::class, 'index']);
        Route::post('webhooks', [WebhooksController::class, 'store']);
        Route::patch('webhooks/{webhook}', [WebhooksController::class, 'update']);
        Route::delete('webhooks/{webhook}', [WebhooksController::class, 'destroy']);
        Route::post('webhooks/{webhook}/test', [WebhooksController::class, 'test']);
        Route::post('webhooks/{webhook}/rotate-secret', [WebhooksController::class, 'rotateSecret']);
        Route::get('webhooks/{webhook}/deliveries', [WebhooksController::class, 'deliveries']);
    });

    Route::middleware([AuthenticateApiKey::class])->group(function (): void {
        Route::post('messages/text', [MessagesController::class, 'storeText'])
            ->middleware([EnsureApiKeyAbility::class.':messages:send', 'throttle:120,1']);
        Route::post('messages/media', [MessagesController::class, 'storeMedia'])
            ->middleware([EnsureApiKeyAbility::class.':messages:send', 'throttle:60,1']);
        Route::get('messages', [MessagesController::class, 'index'])
            ->middleware(EnsureApiKeyAbility::class.':messages:read');
        Route::get('messages/{message}', [MessagesController::class, 'show'])
            ->middleware(EnsureApiKeyAbility::class.':messages:read');
    });
});

Route::prefix('internal/v1')
    ->middleware([VerifyInternalHmac::class])
    ->group(function (): void {
        Route::post('whatsapp/events', WhatsAppEventsController::class);
    });

Route::prefix('admin/v1')
    ->middleware(['auth:sanctum', EnsureAdmin::class])
    ->group(function (): void {
        Route::middleware(EnsurePermission::class.':users.view')->group(function (): void {
            Route::get('users', AdminUsersIndexController::class);
            Route::get('users/pending', [AdminUsersController::class, 'pending']);
        });

        Route::middleware(EnsurePermission::class.':users.approve')->group(function (): void {
            Route::post('users/{userUlid}/approve', [AdminUsersController::class, 'approve']);
            Route::post('users/{userUlid}/reject', [AdminUsersController::class, 'reject']);
        });

        Route::middleware(EnsurePermission::class.':users.suspend')->group(function (): void {
            Route::post('users/{userUlid}/suspend', [AdminUsersController::class, 'suspend']);
            Route::patch('tenants/{tenantUlid}/status', [AdminTenantsController::class, 'updateStatus']);
        });

        Route::middleware(EnsurePermission::class.':subscriptions.view')->group(function (): void {
            Route::get('subscription-requests', [AdminSubscriptionRequestsController::class, 'index']);
            Route::get('subscription-requests/{requestUlid}/payment-proof', [AdminSubscriptionRequestsController::class, 'paymentProof']);
        });

        Route::middleware(EnsurePermission::class.':subscriptions.approve')->group(function (): void {
            Route::post('subscription-requests/{requestUlid}/approve', [AdminSubscriptionRequestsController::class, 'approve']);
            Route::post('subscription-requests/{requestUlid}/reject', [AdminSubscriptionRequestsController::class, 'reject']);
        });

        Route::middleware(EnsurePermission::class.':subscriptions.extend')->group(function (): void {
            Route::post('subscriptions/{subscriptionUlid}/extend', [AdminSubscriptionsController::class, 'extend']);
        });

        Route::middleware(EnsurePermission::class.':subscriptions.suspend')->group(function (): void {
            Route::post('subscriptions/{subscriptionUlid}/suspend', [AdminSubscriptionsController::class, 'suspend']);
            Route::post('subscriptions/{subscriptionUlid}/cancel', [AdminSubscriptionsController::class, 'cancel']);
        });

        Route::middleware(EnsurePermission::class.':support.manage')->prefix('support-tickets')->group(function (): void {
            Route::get('{ticketUlid}', [AdminSupportTicketsController::class, 'show']);
            Route::post('{ticketUlid}/reply', [AdminSupportTicketsController::class, 'reply']);
            Route::patch('{ticketUlid}', [AdminSupportTicketsController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':plans.manage')->group(function (): void {
            Route::get('plans', [AdminPlansController::class, 'index']);
            Route::post('plans', [AdminPlansController::class, 'store']);
            Route::patch('plans/{plan}', [AdminPlansController::class, 'update']);
            Route::delete('plans/{plan}', [AdminPlansController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':settings.manage')->prefix('platform-whatsapp')->group(function (): void {
            Route::get('/', [PlatformWhatsAppController::class, 'show']);
            Route::post('/setup', [PlatformWhatsAppController::class, 'setup']);
            Route::patch('/', [PlatformWhatsAppController::class, 'update']);
            Route::post('/avatar', [PlatformWhatsAppController::class, 'uploadAvatar']);
            Route::post('/connect', [PlatformWhatsAppController::class, 'connect']);
            Route::post('/disconnect', [PlatformWhatsAppController::class, 'disconnect']);
            Route::post('/logout', [PlatformWhatsAppController::class, 'logout']);
            Route::delete('/', [PlatformWhatsAppController::class, 'destroy']);
            Route::post('/socket-token', [PlatformWhatsAppController::class, 'socketToken']);
        });
    });
