<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminSubscriptionResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SubscriptionsPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('subscriptions.view'), 403);

        $status = (string) $request->query('status', '');
        $search = trim((string) $request->query('search', ''));

        $query = Subscription::query()
            ->with(['plan', 'tenant'])
            ->orderByDesc('id');

        if ($status !== '' && SubscriptionStatus::tryFrom($status)) {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('plan_name', 'like', '%'.$search.'%')
                    ->orWhereHas('tenant', fn ($t) => $t->where('name', 'like', '%'.$search.'%')
                        ->orWhere('slug', 'like', '%'.$search.'%'));
            });
        }

        $subscriptions = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions->getCollection()->map(fn (Subscription $s) => AdminSubscriptionResource::make($s))->values(),
            'filters' => ['search' => $search, 'status' => $status],
            'statusOptions' => array_map(fn (SubscriptionStatus $s) => $s->value, SubscriptionStatus::cases()),
            'pagination' => [
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
            ],
        ]);
    }
}
