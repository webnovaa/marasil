<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class UsersPageController extends Controller
{
    public function __invoke(): Response
    {
        $users = User::query()
            ->with('profile')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->ulid,
                'full_name' => $user->profile?->full_name,
                'phone_e164' => $user->phone_e164,
                'status' => $user->status->value,
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Users/Index', ['users' => $users]);
    }
}
