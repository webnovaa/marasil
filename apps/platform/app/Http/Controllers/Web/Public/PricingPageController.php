<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Public;

use App\Domain\Plans\Models\Plan;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use Inertia\Inertia;
use Inertia\Response;

final class PricingPageController extends Controller
{
    public function __invoke(): Response
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->orderBy('price_minor')
            ->get()
            ->map(fn (Plan $plan) => PlanResource::make($plan))
            ->values()
            ->all();

        return Inertia::render('Public/Pricing', [
            'plans' => $plans,
        ]);
    }
}
