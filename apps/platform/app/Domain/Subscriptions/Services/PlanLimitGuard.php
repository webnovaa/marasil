<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Services;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Devices\Models\Device;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Support\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;

final class PlanLimitGuard
{
    public function __construct(
        private readonly SubscriptionGate $subscriptionGate,
        private readonly EntitlementService $entitlements,
    ) {}

    public function currentOrFail(Tenant $tenant): Subscription
    {
        $subscription = $this->subscriptionGate->currentSubscription($tenant);

        if ($subscription === null || ! $this->subscriptionGate->canMutate($subscription)) {
            throw new HttpResponseException(
                ApiResponse::error('SUBSCRIPTION_REQUIRED', 'An active subscription is required.', 403)
            );
        }

        return $subscription;
    }

    public function assertCanCreateDevice(Tenant $tenant): void
    {
        $subscription = $this->currentOrFail($tenant);
        $this->entitlements->assertAllows($subscription, 'devices.access');

        $count = Device::query()->where('tenant_id', $tenant->id)->count();

        if ($count >= (int) $subscription->max_devices) {
            throw new HttpResponseException(
                ApiResponse::error('DEVICE_LIMIT_EXCEEDED', 'Device limit reached for this plan.', 403)
            );
        }
    }

    public function assertCanCreateApiKey(Tenant $tenant): void
    {
        $subscription = $this->currentOrFail($tenant);
        $this->entitlements->assertAllows($subscription, 'api_keys.access');

        $count = ApiKey::query()
            ->where('tenant_id', $tenant->id)
            ->whereNull('device_id')
            ->whereNull('revoked_at')
            ->count();

        if ($count >= (int) $subscription->max_api_keys) {
            throw new HttpResponseException(
                ApiResponse::error('API_KEY_LIMIT_EXCEEDED', 'API key limit reached for this plan.', 403)
            );
        }
    }

    public function assertCanCreateWebhook(Tenant $tenant): void
    {
        $subscription = $this->currentOrFail($tenant);
        $this->entitlements->assertAllows($subscription, 'webhooks.access');

        $count = WebhookEndpoint::query()->where('tenant_id', $tenant->id)->count();

        if ($count >= (int) $subscription->max_webhooks) {
            throw new HttpResponseException(
                ApiResponse::error('WEBHOOK_LIMIT_EXCEEDED', 'Webhook limit reached for this plan.', 403)
            );
        }
    }
}
