<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys\Actions;

use App\Domain\ApiKeys\ApiKeyPrefix;
use App\Domain\ApiKeys\Enums\ApiKeyEnvironment;
use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Subscriptions\Services\PlanLimitGuard;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Str;

final class CreateApiKey
{
    public function __construct(
        private readonly PlanLimitGuard $planLimitGuard,
    ) {}

    /**
     * @param  array{name: string, environment?: string, abilities?: list<string>|null}  $data
     * @return array{api_key: ApiKey, plain_text_key: string}
     */
    public function handle(Tenant $tenant, array $data, bool $deviceBound = false): array
    {
        if (! $deviceBound) {
            $this->planLimitGuard->assertCanCreateApiKey($tenant);
        }

        if (isset($data['device_id'])) {
            $alreadyBound = ApiKey::query()
                ->where('device_id', $data['device_id'])
                ->whereNull('revoked_at')
                ->exists();

            if ($alreadyBound) {
                throw new \Illuminate\Http\Exceptions\HttpResponseException(
                    \App\Support\ApiResponse::error('DEVICE_KEY_EXISTS', 'This device already has an active API key.', 409)
                );
            }
        }

        $environment = ApiKeyEnvironment::tryFrom($data['environment'] ?? 'live')
            ?? ApiKeyEnvironment::Live;

        $prefixBase = ApiKeyPrefix::base($environment);
        $publicId = Str::lower(Str::random(8));
        $prefix = $prefixBase.$publicId;
        $secret = Str::lower(Str::random(40));
        $plainTextKey = $prefix.'_'.$secret;

        $apiKey = ApiKey::query()->create([
            'tenant_id' => $tenant->id,
            'device_id' => $data['device_id'] ?? null,
            'name' => $data['name'],
            'prefix' => $prefix,
            'secret_hash' => hash('sha256', $plainTextKey),
            'secret_encrypted' => encrypt($plainTextKey),
            'environment' => $environment,
            'abilities' => $data['abilities'] ?? ['messages:send', 'messages:read'],
        ]);

        return [
            'api_key' => $apiKey,
            'plain_text_key' => $plainTextKey,
        ];
    }
}
