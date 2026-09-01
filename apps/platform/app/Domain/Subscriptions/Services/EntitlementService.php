<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Services;

use App\Domain\Subscriptions\Models\Subscription;
use App\Support\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;

final class EntitlementService
{
    public function allows(?Subscription $subscription, string $key): bool
    {
        if ($subscription === null) {
            return false;
        }

        $features = $subscription->features;
        if (is_array($features) && array_key_exists($key, $features)) {
            return (bool) $features[$key];
        }

        return match ($key) {
            'devices.access', 'devices.connect', 'devices.reconnect' => (int) $subscription->max_devices > 0,
            'messages.send', 'messages.retry' => true,
            'messages.media' => (bool) $subscription->allow_media,
            'api_keys.access', 'api_keys.rotate' => (int) $subscription->max_api_keys > 0,
            'webhooks.access' => (int) $subscription->max_webhooks > 0,
            'team.access' => (bool) $subscription->allow_team_members,
            'billing.access' => true,
            'priority_queue.access' => (bool) $subscription->allow_priority_queue,
            default => false,
        };
    }

    public function assertAllows(?Subscription $subscription, string $key): void
    {
        if (! $this->allows($subscription, $key)) {
            throw new HttpResponseException(
                ApiResponse::error('FEATURE_NOT_INCLUDED', 'This feature is not included in the current plan.', 403)
            );
        }
    }
}
