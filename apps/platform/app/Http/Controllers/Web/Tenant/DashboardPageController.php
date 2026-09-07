<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Models\User;
use App\Domain\Messaging\Services\DashboardActivity;
use App\Domain\Subscriptions\Actions\GetCurrentSubscription;
use App\Domain\Usage\Services\UsageMeter;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardPageController extends Controller
{
    public function __invoke(Request $request, GetCurrentSubscription $action): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        $subscription = $tenant ? $action->handle($tenant) : null;

        $stats = [
            'devices' => $tenant
                ? Device::query()->where('tenant_id', $tenant->id)->count()
                : 0,
            'webhooks' => $tenant
                ? WebhookEndpoint::query()->where('tenant_id', $tenant->id)->count()
                : 0,
            'messages_used' => $tenant ? app(UsageMeter::class)->used($tenant) : 0,
        ];

        return Inertia::render('Tenant/Dashboard/Index', [
            'subscription' => $subscription
                ? SubscriptionResource::make($subscription->loadMissing('plan'))
                : null,
            'stats' => $stats,
            'activity' => app(DashboardActivity::class)->forTenant($tenant),
        ]);
    }
}
