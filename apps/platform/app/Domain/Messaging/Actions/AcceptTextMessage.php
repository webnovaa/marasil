<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Actions;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Consent\Services\MessageAdmissionService;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Messaging\Enums\MessageStatus;
use App\Domain\Messaging\Enums\MessageType;
use App\Domain\Messaging\Models\Message;
use App\Domain\Messaging\Models\MessageStatusEvent;
use App\Domain\Messaging\Services\ResolveMessagingDevice;
use App\Domain\Subscriptions\Services\EntitlementService;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\ApiResponse;
use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Str;
use RuntimeException;

final class AcceptTextMessage
{
    public function __construct(
        private readonly SubscriptionGate $subscriptionGate,
        private readonly EntitlementService $entitlements,
        private readonly PersistAcceptedMessage $persistAcceptedMessage,
        private readonly MessageAdmissionService $admission,
        private readonly ResolveMessagingDevice $resolveMessagingDevice,
    ) {}

    /**
     * @param  array{device_id: string, to: string, message: string, idempotency_key?: string|null, category?: string|null}  $data
     * @return array{message: Message, created: bool}
     */
    public function handle(Tenant $tenant, array $data, ?ApiKey $apiKey = null): array
    {
        if (! $this->subscriptionGate->canSend($tenant)) {
            throw new HttpResponseException(
                ApiResponse::error('SUBSCRIPTION_REQUIRED', 'An active subscription is required.', 403)
            );
        }

        $subscription = $this->subscriptionGate->currentSubscription($tenant);

        if ($subscription === null) {
            throw new HttpResponseException(
                ApiResponse::error('SUBSCRIPTION_REQUIRED', 'An active subscription is required.', 403)
            );
        }

        $this->entitlements->assertAllows($subscription, 'messages.send');

        $device = $this->resolveMessagingDevice->resolve($tenant, $data, $apiKey);

        $category = (string) ($data['category'] ?? 'transactional');
        $admission = $this->admission->assertAllowed($tenant, $data['to'], $category);

        $idempotencyKey = $data['idempotency_key'] ?? null;

        if (is_string($idempotencyKey) && $idempotencyKey !== '') {
            $existing = Message::query()
                ->where('tenant_id', $tenant->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing !== null) {
                return ['message' => $existing, 'created' => false];
            }
        }

        try {
            $message = $this->persistAcceptedMessage->handle(
                $tenant,
                $subscription,
                function () use ($tenant, $device, $apiKey, $data, $idempotencyKey): Message {
                    $message = Message::query()->create([
                        'tenant_id' => $tenant->id,
                        'device_id' => $device->id,
                        'api_key_id' => $apiKey?->id,
                        'idempotency_key' => $idempotencyKey ?: null,
                        'recipient_e164' => $data['to'],
                        'type' => MessageType::Text,
                        'content_encrypted' => $data['message'],
                        'status' => MessageStatus::Queued,
                        'queued_at' => now(),
                        'request_id' => 'req_'.Str::lower((string) Str::ulid()),
                    ]);

                    MessageStatusEvent::query()->create([
                        'message_id' => $message->id,
                        'status' => MessageStatus::Queued->value,
                        'metadata' => ['source' => 'accept'],
                    ]);

                    return $message;
                },
                $admission['available_at'],
            );
        } catch (QueryException $e) {
            if (is_string($idempotencyKey) && $idempotencyKey !== '') {
                $existing = Message::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existing !== null) {
                    return ['message' => $existing, 'created' => false];
                }
            }

            throw new RuntimeException('Failed to accept message.', previous: $e);
        }

        return ['message' => $message, 'created' => true];
    }
}
