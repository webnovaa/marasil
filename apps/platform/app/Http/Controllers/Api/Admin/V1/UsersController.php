<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Administration\Actions\AdminApproveUser;
use App\Domain\Administration\Actions\AdminRejectUser;
use App\Domain\Administration\Actions\AdminSuspendUser;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectUserRequest;
use App\Http\Requests\Admin\SuspendUserRequest;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class UsersController extends Controller
{
    public function pending(Request $request): JsonResponse
    {
        $this->authorize('viewPending', User::class);

        $users = User::query()
            ->with(['profile', 'roles'])
            ->where('status', UserStatus::PendingApproval)
            ->orderBy('created_at')
            ->paginate(20);

        return ApiResponse::success([
            'users' => $users->getCollection()->map(fn (User $user) => UserResource::make($user))->values(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function approve(Request $request, string $userUlid, AdminApproveUser $action): JsonResponse
    {
        $target = User::query()->where('ulid', $userUlid)->firstOrFail();
        $this->authorize('approve', $target);

        /** @var User $actor */
        $actor = $request->user();

        $user = $action->handle(
            actor: $actor,
            target: $target,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success(['user' => UserResource::make($user)]);
    }

    public function reject(RejectUserRequest $request, string $userUlid, AdminRejectUser $action): JsonResponse
    {
        $target = User::query()->where('ulid', $userUlid)->firstOrFail();
        $this->authorize('reject', $target);

        /** @var User $actor */
        $actor = $request->user();

        $user = $action->handle(
            actor: $actor,
            target: $target,
            reason: $request->string('reason')->toString(),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success(['user' => UserResource::make($user)]);
    }

    public function suspend(SuspendUserRequest $request, string $userUlid, AdminSuspendUser $action): JsonResponse
    {
        $target = User::query()->where('ulid', $userUlid)->firstOrFail();
        $this->authorize('suspend', $target);

        /** @var User $actor */
        $actor = $request->user();

        $user = $action->handle(
            actor: $actor,
            target: $target,
            reason: $request->input('reason'),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success(['user' => UserResource::make($user)]);
    }

    private function requestId(Request $request): string
    {
        $existing = $request->attributes->get('request_id')
            ?? $request->headers->get('X-Request-Id');

        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        return 'req_'.Str::lower((string) Str::ulid());
    }
}
