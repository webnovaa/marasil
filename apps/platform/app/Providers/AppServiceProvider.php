<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\ApiKeys\Policies\ApiKeyPolicy;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Policies\DevicePolicy;
use App\Domain\Identity\Contracts\OtpChannel;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Policies\UserPolicy;
use App\Domain\Identity\Services\FakeOtpChannel;
use App\Domain\Identity\Services\UnconfiguredOtpChannel;
use App\Domain\Identity\Services\WhatsAppOtpChannel;
use App\Domain\Platform\Services\PlatformWhatsAppService;
use App\Domain\Plans\Models\Plan;
use App\Domain\Plans\Policies\PlanPolicy;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Domain\Subscriptions\Policies\SubscriptionRequestPolicy;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Policies\TenantPolicy;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Domain\Webhooks\Policies\WebhookEndpointPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(OtpChannel::class, function ($app): OtpChannel {
            $configured = (string) config('otp.channel', 'auto');

            if ($configured === 'fake' || ($configured === 'auto' && $app->environment(['local', 'testing']))) {
                return $app->make(FakeOtpChannel::class);
            }

            if ($configured === 'whatsapp') {
                return $app->make(WhatsAppOtpChannel::class);
            }

            if ($configured === 'auto' && $app->make(PlatformWhatsAppService::class)->isReady()) {
                return $app->make(WhatsAppOtpChannel::class);
            }

            if ($app->environment(['local', 'testing'])) {
                return $app->make(FakeOtpChannel::class);
            }

            return $app->make(UnconfiguredOtpChannel::class);
        });
    }

    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Tenant::class, TenantPolicy::class);
        Gate::policy(SubscriptionRequest::class, SubscriptionRequestPolicy::class);
        Gate::policy(Plan::class, PlanPolicy::class);
        Gate::policy(Device::class, DevicePolicy::class);
        Gate::policy(ApiKey::class, ApiKeyPolicy::class);
        Gate::policy(WebhookEndpoint::class, WebhookEndpointPolicy::class);

        Gate::define('admin', fn (User $user): bool => $user->isPlatformAdmin());
    }
}
