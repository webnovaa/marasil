<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminUsersIndexController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasPermission('users.view'), 403);

        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');

        $query = User::query()
            ->with(['profile', 'roles'])
            ->orderByDesc('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('phone_e164', 'like', '%'.$search.'%')
                    ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%'.$search.'%')
                        ->orWhere('company_name', 'like', '%'.$search.'%'));
            });
        }

        if ($status !== '' && UserStatus::tryFrom($status)) {
            $query->where('status', $status);
        }

        $users = $query->paginate(20);

        return ApiResponse::success([
            'users' => $users->getCollection()->map(fn (User $u) => UserResource::make($u))->values(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
