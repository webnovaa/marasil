<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class PendingUsersPageController extends Controller
{
    public function __invoke(): Response
    {
        $this->authorize('viewPending', User::class);

        $users = User::query()
            ->with('profile')
            ->where('status', UserStatus::PendingApproval)
            ->orderBy('created_at')
            ->limit(50)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->ulid,
                'full_name' => $user->profile?->full_name,
                'phone_e164' => $user->phone_e164,
                'company_name' => $user->profile?->company_name,
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Users/Pending', [
            'users' => $users,
        ]);
    }
}
