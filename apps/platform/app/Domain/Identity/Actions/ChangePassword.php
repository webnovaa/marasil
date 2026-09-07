<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Models\AuthSession;
use App\Domain\Identity\Models\SecurityEvent;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class ChangePassword
{
    public function handle(
        User $user,
        string $currentPassword,
        string $newPassword,
        bool $revokeOtherSessions = true,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $keepSessionUlid = null,
    ): void {
        if (! Hash::check($currentPassword, (string) $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [__('messages.flash.current_password_invalid')],
            ]);
        }

        if (Hash::check($newPassword, (string) $user->password)) {
            throw ValidationException::withMessages([
                'password' => [__('messages.flash.password_unchanged')],
            ]);
        }

        $user->forceFill(['password' => $newPassword])->save();

        if ($revokeOtherSessions) {
            $query = AuthSession::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at');

            if (is_string($keepSessionUlid) && $keepSessionUlid !== '') {
                $query->where('ulid', '!=', $keepSessionUlid);
            }

            $query->update(['revoked_at' => now()]);
        }

        SecurityEvent::query()->create([
            'user_id' => $user->id,
            'type' => 'password_changed',
            'severity' => 'warning',
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'context' => ['revoked_other_sessions' => $revokeOtherSessions],
        ]);
    }
}
