<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Plans\Models\Plan;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class PlansController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->orderBy('price_minor')
            ->get();

        return ApiResponse::success([
            'plans' => $plans->map(fn (Plan $plan) => PlanResource::make($plan))->values(),
        ]);
    }
}
