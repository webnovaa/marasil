<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Jobs;

use App\Domain\Notifications\Services\TenantOwnerAlertService;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Webhooks\Enums\WebhookDeliveryStatus;
use App\Domain\Webhooks\Enums\WebhookEndpointStatus;
use App\Domain\Webhooks\Models\WebhookDelivery;
use App\Domain\Webhooks\Models\WebhookEndpoint;
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

    public function handle(
        WebhookSigner $signer,
        WebhookUrlValidator $urlValidator,
        TenantOwnerAlertService $ownerAlerts,
    ): void {
        $delivery = WebhookDelivery::query()
            ->with('endpoint.tenant.owner')
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
            $this->alertOwner($endpoint, $delivery, $ownerAlerts, 'عنوان Webhook غير صالح.');

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

            $this->scheduleRetry($delivery, $endpoint, $response->status(), $excerpt, $durationMs, $ownerAlerts);
        } catch (Throwable $e) {
            $durationMs = (int) ((hrtime(true) - $started) / 1_000_000);
            Log::warning('Webhook delivery HTTP error', [
                'delivery' => $this->deliveryUlid,
                'error' => $e->getMessage(),
            ]);
            $this->scheduleRetry($delivery, $endpoint, null, 'HTTP error', $durationMs, $ownerAlerts);
        }
    }

    private function scheduleRetry(
        WebhookDelivery $delivery,
        WebhookEndpoint $endpoint,
        ?int $responseStatus,
        string $excerpt,
        int $durationMs,
        TenantOwnerAlertService $ownerAlerts,
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
            $this->alertOwner(
                $endpoint,
                $delivery,
                $ownerAlerts,
                'توقف إشعار Webhook بعد عدة محاولات فاشلة.',
            );

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

    private function alertOwner(
        WebhookEndpoint $endpoint,
        WebhookDelivery $delivery,
        TenantOwnerAlertService $ownerAlerts,
        string $reason,
    ): void {
        $tenant = $endpoint->relationLoaded('tenant')
            ? $endpoint->tenant
            : Tenant::query()->with('owner')->find($endpoint->tenant_id);

        if ($tenant === null) {
            return;
        }

        $ownerAlerts->alert(
            tenant: $tenant,
            type: 'webhook.abandoned',
            title: 'فشل توصيل Webhook',
            body: sprintf(
                '%s الحدث: %s. راجع صفحة Webhooks وأصلح الرابط أو السر.',
                $reason,
                (string) $delivery->event_type,
            ),
            data: [
                'endpoint_id' => $endpoint->ulid,
                'delivery_id' => $delivery->ulid,
                'event_type' => $delivery->event_type,
            ],
            dedupeKey: 'webhook-abandoned:'.$endpoint->ulid.':'.$delivery->ulid,
        );
    }
}
