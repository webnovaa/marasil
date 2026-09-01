<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use Inertia\Inertia;
use Inertia\Response;

final class PlansPageController extends Controller
{
    public function __invoke(): Response
    {
        /** @var User $user */
        $user = request()->user();
        $tenant = $user->primaryTenant();

        $plans = Plan::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $plan) => PlanResource::make($plan));

        $hasPendingRequest = $tenant !== null
            && SubscriptionRequest::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', SubscriptionRequestStatus::Pending)
                ->exists();

        return Inertia::render('Tenant/Plans/Index', [
            'plans' => $plans,
            'has_pending_request' => $hasPendingRequest,
        ]);
    }
}
