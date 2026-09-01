<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Actions;

use App\Domain\Webhooks\Models\WebhookEndpoint;
use Illuminate\Support\Str;

final class RotateSecret
{
    /**
     * @return array{endpoint: WebhookEndpoint, plain_secret: string}
     */
    public function handle(WebhookEndpoint $endpoint): array
    {
        $plainSecret = 'whsec_'.Str::lower(Str::random(40));

        $endpoint->update([
            'secret_hash' => hash('sha256', $plainSecret),
            'secret_encrypted' => $plainSecret,
        ]);

        return [
            'endpoint' => $endpoint->fresh() ?? $endpoint,
            'plain_secret' => $plainSecret,
        ];
    }
}
