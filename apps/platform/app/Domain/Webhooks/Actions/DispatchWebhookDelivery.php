<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Actions;

use App\Domain\Webhooks\Enums\WebhookDeliveryStatus;
use App\Domain\Webhooks\Enums\WebhookEndpointStatus;
use App\Domain\Webhooks\Jobs\DeliverWebhook;
use App\Domain\Webhooks\Models\WebhookDelivery;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

final class DispatchWebhookDelivery
{
    /**
     * Create a pending delivery (idempotent on endpoint + event_id) and queue it.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handle(
        WebhookEndpoint $endpoint,
        string $eventId,
        string $eventType,
        array $payload,
        bool $force = false,
        bool $queue = true,
    ): ?WebhookDelivery {
        if (! $force && ! $endpoint->isActive()) {
            return null;
        }

        if (! $force && ! $endpoint->subscribesTo($eventType)) {
            return null;
        }

        if ($endpoint->status === WebhookEndpointStatus::Disabled && ! $force) {
            return null;
        }

        $existing = WebhookDelivery::query()
            ->where('webhook_endpoint_id', $endpoint->id)
            ->where('event_id', $eventId)
            ->first();

        if ($existing !== null) {
            Log::debug('Webhook delivery already exists (idempotent)', [
                'event_id' => $eventId,
                'endpoint' => $endpoint->ulid,
            ]);

            return $existing;
        }

        try {
            $delivery = WebhookDelivery::query()->create([
                'tenant_id' => $endpoint->tenant_id,
                'webhook_endpoint_id' => $endpoint->id,
                'event_id' => $eventId,
                'event_type' => $eventType,
                'payload' => $payload,
                'status' => WebhookDeliveryStatus::Pending,
                'attempt_count' => 0,
                'next_attempt_at' => now(),
            ]);
        } catch (QueryException $e) {
            $race = WebhookDelivery::query()
                ->where('webhook_endpoint_id', $endpoint->id)
                ->where('event_id', $eventId)
                ->first();

            if ($race !== null) {
                return $race;
            }

            throw $e;
        }

        if ($queue) {
            DeliverWebhook::dispatch($delivery->ulid);
        }

        return $delivery;
    }

    /**
     * Fan-out an event to all active endpoints for a tenant.
     *
     * @param  array<string, mixed>  $payload
     * @return list<WebhookDelivery>
     */
    public function forTenant(int $tenantId, string $eventId, string $eventType, array $payload): array
    {
        $endpoints = WebhookEndpoint::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', [
                WebhookEndpointStatus::Active->value,
                WebhookEndpointStatus::Failing->value,
            ])
            ->get();

        $deliveries = [];

        foreach ($endpoints as $endpoint) {
            $delivery = $this->handle($endpoint, $eventId, $eventType, $payload);
            if ($delivery !== null) {
                $deliveries[] = $delivery;
            }
        }

        return $deliveries;
    }
}
