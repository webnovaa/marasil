<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Models\AuthSession;
use App\Domain\Identity\Models\SecurityEvent;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\Auth;

final class LogoutUser
{
    public function handle(?User $user, ?string $ip = null, ?string $userAgent = null): void
    {
        if ($user !== null) {
            AuthSession::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            SecurityEvent::query()->create([
                'user_id' => $user->id,
                'type' => 'logout',
                'severity' => 'info',
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'context' => [],
            ]);
        }

        Auth::guard('web')->logout();

        if (request()->hasSession()) {
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }
    }
}
