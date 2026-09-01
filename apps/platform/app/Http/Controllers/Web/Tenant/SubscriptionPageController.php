<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Actions\GetCurrentSubscription;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionRequestResource;
use App\Http\Resources\SubscriptionResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SubscriptionPageController extends Controller
{
    public function __invoke(Request $request, GetCurrentSubscription $action): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        $subscription = $tenant ? $action->handle($tenant) : null;
        $requests = $tenant
            ? SubscriptionRequest::query()
                ->with('plan')
                ->where('tenant_id', $tenant->id)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->map(fn (SubscriptionRequest $item) => SubscriptionRequestResource::make($item))
            : collect();

        return Inertia::render('Tenant/Subscription/Index', [
            'subscription' => $subscription
                ? SubscriptionResource::make($subscription->loadMissing('plan'))
                : null,
            'requests' => $requests,
        ]);
    }
}
