<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionRequestResource;
use Inertia\Inertia;
use Inertia\Response;

final class SubscriptionRequestsPageController extends Controller
{
    public function __invoke(): Response
    {
        $this->authorize('viewAny', SubscriptionRequest::class);

        $requests = SubscriptionRequest::query()
            ->with(['plan', 'tenant', 'requester.profile'])
            ->where('status', SubscriptionRequestStatus::Pending)
            ->orderBy('created_at')
            ->limit(50)
            ->get()
            ->map(fn (SubscriptionRequest $item) => SubscriptionRequestResource::make($item));

        return Inertia::render('Admin/SubscriptionRequests/Index', [
            'requests' => $requests,
        ]);
    }
}
