<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Jobs;

use App\Domain\Webhooks\Enums\WebhookDeliveryStatus;
use App\Domain\Webhooks\Enums\WebhookEndpointStatus;
use App\Domain\Webhooks\Models\WebhookDelivery;
use App\Domain\Webhooks\Services\WebhookSigner;
use App\Domain\Webhooks\Services\WebhookUrlValidator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

final class DeliverWebhook implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(
        public readonly string $deliveryUlid,
    ) {}

    public function handle(WebhookSigner $signer, WebhookUrlValidator $urlValidator): void
    {
        $delivery = WebhookDelivery::query()
            ->with('endpoint')
            ->where('ulid', $this->deliveryUlid)
            ->first();

        if ($delivery === null) {
            return;
        }

        if (in_array($delivery->status, [WebhookDeliveryStatus::Delivered, WebhookDeliveryStatus::Abandoned], true)) {
            return;
        }

        $endpoint = $delivery->endpoint;
        if ($endpoint === null) {
            $delivery->update(['status' => WebhookDeliveryStatus::Abandoned]);

            return;
        }

        try {
            $urlValidator->validate($endpoint->url);
        } catch (InvalidArgumentException $e) {
            $delivery->update([
                'status' => WebhookDeliveryStatus::Abandoned,
                'response_excerpt' => $e->getMessage(),
            ]);
            $endpoint->update([
                'status' => WebhookEndpointStatus::Failing,
                'last_failure_at' => now(),
                'failure_count' => $endpoint->failure_count + 1,
            ]);

            return;
        }

        $delivery->update(['status' => WebhookDeliveryStatus::Delivering]);

        $body = json_encode($delivery->payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        $timestamp = (string) time();
        $secret = (string) $endpoint->secret_encrypted;
        $headers = $signer->headers($secret, $delivery->ulid, $timestamp, $body);

        $started = hrtime(true);

        try {
            $response = Http::timeout((int) config('webhooks.timeout_seconds', 10))
                ->withHeaders($headers)
                ->withBody($body, 'application/json')
                ->post($endpoint->url);

            $durationMs = (int) ((hrtime(true) - $started) / 1_000_000);
            $excerpt = mb_substr($response->body(), 0, 500);

            if ($response->successful()) {
                $delivery->update([
                    'status' => WebhookDeliveryStatus::Delivered,
                    'attempt_count' => $delivery->attempt_count + 1,
                    'response_status' => $response->status(),
                    'response_excerpt' => $excerpt,
                    'duration_ms' => $durationMs,
                    'delivered_at' => now(),
                    'next_attempt_at' => null,
                ]);

                $endpoint->update([
                    'last_success_at' => now(),
                    'failure_count' => 0,
                    'status' => WebhookEndpointStatus::Active,
                ]);

                return;
            }

            $this->scheduleRetry($delivery, $endpoint, $response->status(), $excerpt, $durationMs);
        } catch (Throwable $e) {
            $durationMs = (int) ((hrtime(true) - $started) / 1_000_000);
            Log::warning('Webhook delivery HTTP error', [
                'delivery' => $this->deliveryUlid,
                'error' => $e->getMessage(),
            ]);
            $this->scheduleRetry($delivery, $endpoint, null, 'HTTP error', $durationMs);
        }
    }

    private function scheduleRetry(
        WebhookDelivery $delivery,
        \App\Domain\Webhooks\Models\WebhookEndpoint $endpoint,
        ?int $responseStatus,
        string $excerpt,
        int $durationMs,
    ): void {
        $attempt = $delivery->attempt_count + 1;
        /** @var list<int> $delays */
        $delays = config('webhooks.retry_delays_minutes', [1, 5, 30, 120, 720]);
        $maxRetries = (int) config('webhooks.max_retries', 5);

        $updates = [
            'attempt_count' => $attempt,
            'response_status' => $responseStatus,
            'response_excerpt' => $excerpt,
            'duration_ms' => $durationMs,
        ];

        $endpoint->update([
            'last_failure_at' => now(),
            'failure_count' => $endpoint->failure_count + 1,
            'status' => WebhookEndpointStatus::Failing,
        ]);

        if ($attempt >= $maxRetries || $attempt > count($delays)) {
            $delivery->update(array_merge($updates, [
                'status' => WebhookDeliveryStatus::Abandoned,
                'next_attempt_at' => null,
            ]));

            return;
        }

        $delayMinutes = $delays[$attempt - 1] ?? end($delays);
        $nextAt = now()->addMinutes((int) $delayMinutes);

        $delivery->update(array_merge($updates, [
            'status' => WebhookDeliveryStatus::Failed,
            'next_attempt_at' => $nextAt,
        ]));

        self::dispatch($delivery->ulid)->delay($nextAt);
    }
}
