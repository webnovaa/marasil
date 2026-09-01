<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Webhooks\Models\WebhookDelivery;

final class WebhookDeliveryResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(WebhookDelivery $delivery): array
    {
        return [
            'id' => $delivery->ulid,
            'event_id' => $delivery->event_id,
            'event_type' => $delivery->event_type,
            'status' => $delivery->status->value,
            'attempt_count' => $delivery->attempt_count,
            'next_attempt_at' => $delivery->next_attempt_at?->toIso8601String(),
            'response_status' => $delivery->response_status,
            'response_excerpt' => $delivery->response_excerpt,
            'duration_ms' => $delivery->duration_ms,
            'delivered_at' => $delivery->delivered_at?->toIso8601String(),
            'created_at' => $delivery->created_at?->toIso8601String(),
        ];
    }

    /**
     * @param  iterable<WebhookDelivery>  $deliveries
     * @return list<array<string, mixed>>
     */
    public static function collection(iterable $deliveries): array
    {
        $items = [];

        foreach ($deliveries as $delivery) {
            $items[] = self::make($delivery);
        }

        return $items;
    }
}
