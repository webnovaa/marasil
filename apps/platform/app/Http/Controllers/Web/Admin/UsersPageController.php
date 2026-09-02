<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class UsersPageController extends Controller
{
    public function __invoke(Request $request): Response
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

        $users = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users->getCollection()->map(fn (User $user) => UserResource::make($user))->values(),
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'statusOptions' => array_map(fn (UserStatus $s) => $s->value, UserStatus::cases()),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
