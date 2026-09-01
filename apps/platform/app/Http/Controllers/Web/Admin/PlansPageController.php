<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Plans\Models\Plan;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use Inertia\Inertia;
use Inertia\Response;

final class PlansPageController extends Controller
{
    public function __invoke(): Response
    {
        $this->authorize('viewAny', Plan::class);

        $plans = Plan::query()
            ->orderBy('sort_order')
            ->orderBy('price_minor')
            ->get()
            ->map(fn (Plan $plan) => PlanResource::make($plan))
            ->values()
            ->all();

        return Inertia::render('Admin/Plans/Index', [
            'plans' => $plans,
        ]);
    }
}
