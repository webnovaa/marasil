<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Plans\Actions\CreatePlan;
use App\Domain\Plans\Actions\DeletePlan;
use App\Domain\Plans\Actions\UpdatePlan;
use App\Domain\Plans\Models\Plan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePlanRequest;
use App\Http\Requests\Admin\UpdatePlanRequest;
use App\Http\Resources\PlanResource;
use App\Support\ApiResponse;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlansController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Plan::class);

        $includeInactive = $request->boolean('include_inactive', true);

        $query = Plan::query()->orderBy('sort_order')->orderBy('price_minor');
        if (! $includeInactive) {
            $query->where('is_active', true);
        }

        $plans = $query->get();

        return ApiResponse::success([
            'plans' => $plans->map(fn (Plan $plan) => PlanResource::make($plan))->values(),
        ]);
    }

    public function store(StorePlanRequest $request, CreatePlan $action): JsonResponse
    {
        $this->authorize('create', Plan::class);

        $plan = $action->handle($request->validated());

        return ApiResponse::success([
            'plan' => PlanResource::make($plan),
        ], 201);
    }

    public function update(UpdatePlanRequest $request, Plan $plan, UpdatePlan $action): JsonResponse
    {
        $this->authorize('update', $plan);

        $plan = $action->handle($plan, $request->validated());

        return ApiResponse::success([
            'plan' => PlanResource::make($plan),
        ]);
    }

    public function destroy(Plan $plan, DeletePlan $action): JsonResponse
    {
        $this->authorize('delete', $plan);

        try {
            $action->handle($plan);
        } catch (DomainException $e) {
            return ApiResponse::error('PLAN_IN_USE', $e->getMessage(), 422);
        }

        return ApiResponse::success(['deleted' => true]);
    }
}
