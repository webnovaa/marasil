<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Usage\Services\UsageMeter;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class UsagePageController extends Controller
{
    public function __invoke(Request $request, UsageMeter $meter, SubscriptionGate $gate): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        $subscription = $tenant ? $gate->currentSubscription($tenant) : null;

        return Inertia::render('Tenant/Usage/Index', [
            'usage' => [
                'messages_used' => $tenant ? $meter->used($tenant) : 0,
                'messages_limit' => (int) ($subscription?->monthly_message_limit ?? 0),
                'devices_used' => $tenant ? Device::query()->where('tenant_id', $tenant->id)->count() : 0,
                'devices_limit' => (int) ($subscription?->max_devices ?? 0),
                'api_keys_used' => $tenant
                    ? ApiKey::query()->where('tenant_id', $tenant->id)->whereNull('revoked_at')->count()
                    : 0,
                'api_keys_limit' => (int) ($subscription?->max_api_keys ?? 0),
                'webhooks_used' => $tenant ? WebhookEndpoint::query()->where('tenant_id', $tenant->id)->count() : 0,
                'webhooks_limit' => (int) ($subscription?->max_webhooks ?? 0),
            ],
        ]);
    }
}
