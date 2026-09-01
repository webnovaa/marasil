<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys\Actions;

use App\Domain\ApiKeys\ApiKeyPrefix;
use App\Domain\ApiKeys\Enums\ApiKeyEnvironment;
use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RotateApiKey
{
    public function __construct(
        private readonly RevokeApiKey $revokeApiKey,
    ) {}

    /**
     * @return array{api_key: ApiKey, plain_text_key: string}
     */
    public function handle(ApiKey $apiKey, ?User $actor = null): array
    {
        return DB::transaction(function () use ($apiKey, $actor): array {
            $deviceId = $apiKey->device_id;

            $this->revokeApiKey->handle($apiKey, $actor, 'rotated');

            $environment = $apiKey->environment instanceof ApiKeyEnvironment
                ? $apiKey->environment
                : ApiKeyEnvironment::Live;

            $prefixBase = ApiKeyPrefix::base($environment);
            $publicId = Str::lower(Str::random(8));
            $prefix = $prefixBase.$publicId;
            $secret = Str::lower(Str::random(40));
            $plainTextKey = $prefix.'_'.$secret;

            $newKey = ApiKey::query()->create([
                'tenant_id' => $apiKey->tenant_id,
                'device_id' => $deviceId,
                'name' => $apiKey->name,
                'prefix' => $prefix,
                'secret_hash' => hash('sha256', $plainTextKey),
                'secret_encrypted' => encrypt($plainTextKey),
                'environment' => $environment,
                'abilities' => $apiKey->abilities,
            ]);

            return [
                'api_key' => $newKey,
                'plain_text_key' => $plainTextKey,
            ];
        });
    }
}
