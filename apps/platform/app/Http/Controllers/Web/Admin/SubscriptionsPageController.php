<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Subscriptions\Models\Subscription;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class SubscriptionsPageController extends Controller
{
    public function __invoke(): Response
    {
        $subscriptions = Subscription::query()
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (Subscription $subscription): array => [
                'id' => $subscription->ulid,
                'plan_name' => $subscription->plan_name,
                'status' => $subscription->status->value,
                'ends_at' => $subscription->ends_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Subscriptions/Index', ['subscriptions' => $subscriptions]);
    }
}
