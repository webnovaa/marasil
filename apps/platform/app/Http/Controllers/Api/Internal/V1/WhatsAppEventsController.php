<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Internal\V1;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use App\Domain\Devices\Models\DeviceSession;
use App\Domain\Messaging\Enums\MessageStatus;
use App\Domain\Messaging\Models\Message;
use App\Domain\Messaging\Models\MessageStatusEvent;
use App\Domain\Webhooks\Actions\DispatchWebhookDelivery;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

final class WhatsAppEventsController extends Controller
{
    public function __construct(
        private readonly DispatchWebhookDelivery $dispatchWebhookDelivery,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => ['required', 'string', 'max:64'],
            'event_type' => ['required', 'string', 'max:64'],
            'device_id' => ['required', 'string', 'size:26'],
            'occurred_at' => ['sometimes', 'nullable', 'date'],
            'payload' => ['sometimes', 'array'],
        ]);

        $device = Device::query()->where('ulid', $validated['device_id'])->first();

        if ($device === null) {
            return ApiResponse::error('DEVICE_NOT_FOUND', 'Device not found.', 404);
        }

        if (! Cache::add('wa-event:'.hash('sha256', (string) $validated['event_id']), true, now()->addDays(7))) {
            return ApiResponse::success(['accepted' => true, 'duplicate' => true], 202);
        }

        $payload = $validated['payload'] ?? [];
        if (($payload['tenant_id'] ?? null) !== $device->tenant?->ulid || (int) ($payload['lease_generation'] ?? -1) !== (int) $device->lease_generation) {
            return ApiResponse::error('STALE_ENGINE_EVENT', 'Event context is no longer authoritative.', 409);
        }
        $eventType = $validated['event_type'];

        DB::transaction(function () use ($device, $eventType, $payload, $validated): void {
            $from = $device->status->value;

            match ($eventType) {
                'device.qr_ready' => $device->update(['status' => DeviceStatus::WaitingForQr]),
                'device.connecting' => $device->update(['status' => DeviceStatus::Connecting]),
                'device.reconnecting' => $device->update(['status' => DeviceStatus::Reconnecting]),
                'device.connected' => $this->markConnected($device, $payload),
                'device.disconnected' => $device->update([
                    'status' => DeviceStatus::Disconnected,
                    'last_disconnected_at' => now(),
                    'disconnect_reason' => (string) ($payload['reason'] ?? 'provider'),
                ]),
                'device.logged_out' => $device->update(['status' => DeviceStatus::LoggedOut]),
                'device.session_updated' => $device->update(['session_version' => $device->session_version + 1]),
                'device.error' => $device->update(['status' => DeviceStatus::Failed, 'last_error_code' => (string) ($payload['error_code'] ?? 'ENGINE_FAILURE'), 'last_error_at' => now()]),
                'message.sent', 'message.delivered', 'message.read', 'message.failed' => $this->applyMessageEvent(
                    $eventType,
                    $payload,
                    (string) $validated['event_id'],
                ),
                'message.received' => $this->applyInboundMessage($device, $payload),
                default => null,
            };

            DeviceEvent::query()->create([
                'device_id' => $device->id,
                'tenant_id' => $device->tenant_id,
                'event_type' => $eventType,
                'from_status' => $from,
                'to_status' => $device->fresh()?->status->value ?? $from,
                'reason_code' => (string) ($payload['reason_code'] ?? ''),
                'metadata' => [
                    'event_id' => $validated['event_id'],
                    'sanitized' => true,
                ],
            ]);
        });

        return ApiResponse::success(['accepted' => true], 202);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function markConnected(Device $device, array $payload): void
    {
        $device->update([
            'status' => DeviceStatus::Connected,
            'phone_e164' => isset($payload['phone_number']) ? '+'.ltrim((string) $payload['phone_number'], '+') : $device->phone_e164,
            'display_name' => isset($payload['display_name']) ? (string) $payload['display_name'] : $device->display_name,
            'worker_id' => isset($payload['worker_id']) ? (string) $payload['worker_id'] : $device->worker_id,
            'last_connected_at' => now(),
            'last_heartbeat_at' => now(),
            'last_error_code' => null,
            'last_error_message' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function storeCredentials(Device $device, array $payload): void
    {
        // Credentials arrive already opaque from the worker; encrypt at rest via model cast.
        $session = DeviceSession::query()->firstOrCreate(['device_id' => $device->id]);

        $session->update([
            'encrypted_data' => isset($payload['credentials']) ? (string) json_encode($payload['credentials']) : $session->encrypted_data,
            'encrypted_data_key' => isset($payload['data_key']) ? (string) $payload['data_key'] : $session->encrypted_data_key,
            'encryption_key_version' => (int) ($payload['key_version'] ?? $session->encryption_key_version ?? 1),
            'nonce' => isset($payload['nonce']) ? (string) $payload['nonce'] : $session->nonce,
            'auth_tag' => isset($payload['auth_tag']) ? (string) $payload['auth_tag'] : $session->auth_tag,
            'credentials_version' => (int) ($payload['credentials_version'] ?? ($session->credentials_version + 1)),
            'rotated_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function applyMessageEvent(string $eventType, array $payload, string $eventId): void
    {
        $messageUlid = isset($payload['message_id']) ? (string) $payload['message_id'] : '';
        if ($messageUlid === '') {
            return;
        }

        $message = Message::query()->where('ulid', $messageUlid)->first();
        if ($message === null) {
            return;
        }

        $status = match ($eventType) {
            'message.sent' => MessageStatus::Sent,
            'message.delivered' => MessageStatus::Delivered,
            'message.read' => MessageStatus::Read,
            'message.failed' => MessageStatus::Failed,
            default => null,
        };

        if ($status === null) {
            return;
        }

        $updates = ['status' => $status];

        if ($status === MessageStatus::Sent) {
            $updates['sent_at'] = now();
            $updates['provider_message_id'] = (string) ($payload['provider_message_id'] ?? $message->provider_message_id);
        }

        if ($status === MessageStatus::Delivered) {
            $updates['delivered_at'] = now();
        }

        if ($status === MessageStatus::Read) {
            $updates['read_at'] = now();
        }

        if ($status === MessageStatus::Failed) {
            $updates['failed_at'] = now();
            $updates['error_code'] = (string) ($payload['error_code'] ?? 'PROVIDER_TEMPORARILY_UNAVAILABLE');
            $updates['error_message'] = (string) ($payload['error_message'] ?? 'Message failed.');

            $this->alertOwnerOfFailure($message, (string) $updates['error_code'], (string) $updates['error_message']);
        }

        $message->update($updates);

        MessageStatusEvent::query()->create([
            'message_id' => $message->id,
            'status' => $status->value,
            'provider_timestamp' => isset($payload['provider_timestamp']) ? Carbon::parse((string) $payload['provider_timestamp']) : null,
            'metadata' => ['event_type' => $eventType],
        ]);

        $this->dispatchWebhookDelivery->forTenant(
            (int) $message->tenant_id,
            $eventId,
            $eventType,
            [
                'event' => $eventType,
                'message_id' => $message->ulid,
                'device_id' => $message->device?->ulid,
                'to' => $message->recipient_e164,
                'status' => $status->value,
                'provider_message_id' => $message->provider_message_id,
                'error_code' => $message->error_code,
                'occurred_at' => now()->toIso8601String(),
            ],
        );
    }

    private function alertOwnerOfFailure(Message $message, string $code, string $reason): void
    {
        $tenant = $message->relationLoaded('tenant')
            ? $message->tenant
            : \App\Domain\Tenancy\Models\Tenant::query()->with('owner')->find($message->tenant_id);

        if ($tenant === null) {
            return;
        }

        $to = (string) $message->recipient_e164;
        $reasonArabic = match ($code) {
            'RECIPIENT_NOT_ON_WHATSAPP' => 'الرقم ليس لديه حساب واتساب نشط',
            'DEVICE_DISCONNECTED' => 'جهاز الإرسال غير متصل بالشبكة',
            'RATE_LIMIT_EXCEEDED' => 'تم تجاوز حد الإرسال المسموح في باقتك',
            default => $reason,
        };

        try {
            app(\App\Domain\Notifications\Services\TenantOwnerAlertService::class)->alert(
                tenant: $tenant,
                type: 'message.failed',
                title: 'فشل إرسال رسالة واتساب',
                body: "تعذر تسليم الرسالة للرقم {$to}. السبب: {$reasonArabic}.",
                data: [
                    'message_id' => $message->ulid,
                    'to' => $to,
                    'error_code' => $code,
                    'reason' => $reasonArabic,
                ],
                dedupeKey: 'message-failed:'.$message->ulid,
            );
        } catch (\Throwable) {
            // Ignore alert dispatch failures
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function applyInboundMessage(Device $device, array $payload): void
    {
        $senderPhone = (string) ($payload['sender_phone'] ?? '');
        $body = (string) ($payload['text'] ?? '');
        $providerId = (string) ($payload['provider_message_id'] ?? '');
        $pushName = (string) ($payload['push_name'] ?? '');

        if ($senderPhone === '') {
            return;
        }

        // 1. Store Inbound Message
        \App\Domain\Messaging\Models\InboundMessage::query()->create([
            'tenant_id' => $device->tenant_id,
            'device_id' => $device->id,
            'sender_phone_e164' => $senderPhone,
            'provider_message_id' => $providerId ?: null,
            'body' => $body,
            'push_name' => $pushName ?: null,
            'raw_payload' => $payload,
            'received_at' => isset($payload['timestamp']) ? Carbon::createFromTimestamp((int) $payload['timestamp']) : now(),
        ]);

        // 2. Dispatch tenant webhook for inbound message
        $this->dispatchWebhookDelivery->execute(
            tenantId: (int) $device->tenant_id,
            eventType: 'message.received',
            payload: [
                'event' => 'message.received',
                'device_id' => $device->ulid,
                'from' => $senderPhone,
                'push_name' => $pushName,
                'body' => $body,
                'provider_message_id' => $providerId,
                'received_at' => now()->toIso8601String(),
            ],
        );

        // 3. Auto-Reply matching and response dispatch
        if ($body !== '') {
            $autoReply = \App\Domain\AutoReplies\Models\AutoReply::query()
                ->where('tenant_id', $device->tenant_id)
                ->where('is_active', true)
                ->where(function ($q) use ($device) {
                    $q->whereNull('device_id')->orWhere('device_id', $device->id);
                })
                ->get()
                ->first(fn ($rule) => $rule->matches($body));

            if ($autoReply !== null) {
                $autoReply->increment('reply_count');
                $replyText = \App\Support\Spintax::process($autoReply->reply_text);

                try {
                    $tenant = $device->tenant ?? \App\Domain\Tenancy\Models\Tenant::find($device->tenant_id);
                    if ($tenant !== null) {
                        app(\App\Domain\Messaging\Actions\AcceptTextMessage::class)->handle(
                            tenant: $tenant,
                            data: [
                                'device_id' => $device->ulid,
                                'to' => $senderPhone,
                                'message' => $replyText,
                                'category' => 'customer_support',
                            ],
                        );
                    }
                } catch (\Throwable) {
                    // Fail silently to avoid breaking the webhook
                }
            } else {
                // 4. Gemini AI Assistant response if enabled
                $this->dispatchGeminiAiReply($device, $senderPhone, $body);
            }
        }
    }

    private function dispatchGeminiAiReply(Device $device, string $senderPhone, string $incomingText): void
    {
        try {
            // 1. Check Platform Master Switch
            if (! \App\Domain\Platform\Models\PlatformSetting::isAiMasterEnabled()) {
                return;
            }

            // 2. Check Subscription Plan Feature (exclusive to top tier)
            $tenant = $device->tenant ?? \App\Domain\Tenancy\Models\Tenant::find($device->tenant_id);
            if ($tenant === null || ! app(\App\Domain\Subscriptions\Services\SubscriptionGate::class)->hasFeature($tenant, 'ai_assistant')) {
                return;
            }

            $aiSetting = \App\Domain\Ai\Models\TenantAiSetting::query()
                ->where('tenant_id', $device->tenant_id)
                ->where('is_enabled', true)
                ->first();

            if ($aiSetting === null || empty($aiSetting->gemini_api_key)) {
                return;
            }

            // Fetch recent messages for conversational context
            $recentInbound = \App\Domain\Messaging\Models\InboundMessage::query()
                ->where('tenant_id', $device->tenant_id)
                ->where('sender_phone_e164', $senderPhone)
                ->latest('id')
                ->take(3)
                ->get()
                ->map(fn ($m) => ['role' => 'user', 'content' => $m->body]);

            $geminiService = app(\App\Domain\Ai\Services\GeminiService::class);
            $reply = $geminiService->generateReply($aiSetting, $incomingText, $recentInbound->reverse()->values()->all());

            if (! empty($reply)) {
                $aiSetting->increment('total_ai_replies');
                $tenant = $device->tenant ?? \App\Domain\Tenancy\Models\Tenant::find($device->tenant_id);
                if ($tenant !== null) {
                    app(\App\Domain\Messaging\Actions\AcceptTextMessage::class)->handle(
                        tenant: $tenant,
                        data: [
                            'device_id' => $device->ulid,
                            'to' => $senderPhone,
                            'message' => $reply,
                            'category' => 'customer_support',
                        ],
                    );
                }
            }
        } catch (\Throwable) {
            // Fail silently to keep webhook resilient
        }
    }
}
