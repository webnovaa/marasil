<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Actions;

use App\Domain\Webhooks\Models\WebhookDelivery;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use Illuminate\Support\Str;

final class TestWebhook
{
    public function __construct(
        private readonly DispatchWebhookDelivery $dispatchWebhookDelivery,
    ) {}

    public function handle(WebhookEndpoint $endpoint): WebhookDelivery
    {
        $eventId = 'evt_test_'.Str::lower((string) Str::ulid());

        $delivery = $this->dispatchWebhookDelivery->handle(
            $endpoint,
            $eventId,
            'webhook.test',
            [
                'event' => 'webhook.test',
                'webhook_id' => $endpoint->ulid,
                'message' => 'Webhook endpoint test event.',
                'occurred_at' => now()->toIso8601String(),
            ],
            force: true,
            queue: true,
        );

        return $delivery ?? WebhookDelivery::query()
            ->where('webhook_endpoint_id', $endpoint->id)
            ->where('event_id', $eventId)
            ->firstOrFail();
    }
}
