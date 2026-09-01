<?php

declare(strict_types=1);

namespace App\Domain\Notifications\Services;

use App\Domain\Identity\Models\User;
use App\Domain\Notifications\Models\InAppNotification;
use App\Domain\Notifications\Models\NotificationPreference;

final class NotificationService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function notify(
        User $user,
        string $type,
        string $title,
        string $body,
        array $data = [],
        ?string $dedupeKey = null,
        ?int $tenantId = null,
    ): ?InAppNotification {
        $prefs = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'in_app_enabled' => true,
                'security_critical_enabled' => true,
                'usage_alerts_enabled' => true,
                'device_alerts_enabled' => true,
            ],
        );

        $isSecurity = str_starts_with($type, 'security.');
        $isUsage = str_starts_with($type, 'usage.');
        $isDevice = str_starts_with($type, 'device.');

        if (! ($prefs->in_app_enabled ?? true) && ! $isSecurity) {
            return null;
        }

        if ($isUsage && ! ($prefs->usage_alerts_enabled ?? true)) {
            return null;
        }

        if ($isDevice && ! ($prefs->device_alerts_enabled ?? true)) {
            return null;
        }

        $attributes = [
            'tenant_id' => $tenantId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ];

        if ($dedupeKey !== null) {
            return InAppNotification::query()->firstOrCreate(
                ['user_id' => $user->id, 'dedupe_key' => $dedupeKey],
                $attributes,
            );
        }

        return InAppNotification::query()->create([
            'user_id' => $user->id,
            ...$attributes,
        ]);
    }

    public function unreadCount(User $user): int
    {
        return (int) InAppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    public function markRead(User $user, string $ulid): void
    {
        InAppNotification::query()
            ->where('user_id', $user->id)
            ->where('ulid', $ulid)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function markAllRead(User $user): void
    {
        InAppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
