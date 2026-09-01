<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys\Actions;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Identity\Models\User;

final class RevokeApiKey
{
    public function handle(ApiKey $apiKey, ?User $actor = null, ?string $reason = null): ApiKey
    {
        if ($apiKey->revoked_at !== null) {
            return $apiKey;
        }

        $apiKey->update([
            'revoked_at' => now(),
            'revoked_by' => $actor?->id,
            'revocation_reason' => $reason ?? 'revoked_by_user',
            'device_id' => null,
            'secret_encrypted' => null,
        ]);

        return $apiKey->fresh() ?? $apiKey;
    }
}
