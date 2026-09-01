<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Webhooks\Models\WebhookEndpoint;

final class WebhookEndpointResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(WebhookEndpoint $endpoint, ?string $plainSecret = null): array
    {
        $payload = [
            'id' => $endpoint->ulid,
            'name' => $endpoint->name,
            'url' => $endpoint->url,
            'subscribed_events' => $endpoint->subscribed_events ?? [],
            'status' => $endpoint->status->value,
            'last_success_at' => $endpoint->last_success_at?->toIso8601String(),
            'last_failure_at' => $endpoint->last_failure_at?->toIso8601String(),
            'failure_count' => $endpoint->failure_count,
            'created_at' => $endpoint->created_at?->toIso8601String(),
        ];

        if ($plainSecret !== null) {
            $payload['secret'] = $plainSecret;
        }

        return $payload;
    }

    /**
     * @param  iterable<WebhookEndpoint>  $endpoints
     * @return list<array<string, mixed>>
     */
    public static function collection(iterable $endpoints): array
    {
        $items = [];

        foreach ($endpoints as $endpoint) {
            $items[] = self::make($endpoint);
        }

        return $items;
    }
}
