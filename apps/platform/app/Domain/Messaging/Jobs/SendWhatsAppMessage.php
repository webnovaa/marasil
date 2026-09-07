<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Jobs;

use App\Domain\Devices\Services\WhatsAppServiceClient;
use App\Domain\Messaging\Enums\MessageStatus;
use App\Domain\Messaging\Models\Message;
use App\Domain\Messaging\Models\MessageAttempt;
use App\Domain\Messaging\Models\MessageStatusEvent;
use App\Domain\Messaging\Services\MessageTransportPayload;
use App\Domain\Notifications\Services\TenantOwnerAlertService;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Usage\Services\UsageMeter;
use App\Domain\Webhooks\Actions\DispatchWebhookDelivery;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class SendWhatsAppMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public readonly string $messageUlid,
    ) {}

    public function handle(
        WhatsAppServiceClient $client,
        DispatchWebhookDelivery $dispatchWebhook,
        UsageMeter $usageMeter,
        TenantOwnerAlertService $ownerAlerts,
    ): void {
        $message = Message::query()->where('ulid', $this->messageUlid)->first();

        if ($message === null) {
            return;
        }

        if (! in_array($message->status, [MessageStatus::Queued, MessageStatus::Processing], true)) {
            return;
        }

        $attemptNumber = (int) $message->attempts()->count() + 1;

        $attempt = MessageAttempt::query()->create([
            'message_id' => $message->id,
            'attempt_number' => $attemptNumber,
            'started_at' => now(),
            'status' => 'started',
        ]);

        $usageMeter->commit($message);

        $message->update([
            'status' => MessageStatus::Processing,
            'processing_at' => now(),
        ]);

        try {
            $device = $message->device;

            if ($device === null) {
                $message->update([
                    'status' => MessageStatus::Failed,
                    'failed_at' => now(),
                    'error_code' => 'DEVICE_NOT_FOUND',
                    'error_message' => 'Device is no longer available.',
                ]);
                $this->notifyWebhooks($dispatchWebhook, $message, 'message.failed');
                $this->alertOwnerOfFailure($ownerAlerts, $message);

                return;
            }

            $result = $client->sendMessage([
                'command_id' => 'send_'.$message->ulid,
                'device_id' => $device->ulid,
                'tenant_id' => $device->tenant?->ulid,
                'lease_generation' => $device->lease_generation,
                'message_id' => $message->ulid,
                'recipient' => $message->recipient_e164,
                ...app(MessageTransportPayload::class)->content($message),
            ]);

            $data = is_array($result['data'] ?? null) ? $result['data'] : $result;
            $status = (string) ($data['status'] ?? 'sent');

            if ($status === 'failed') {
                $message->update([
                    'status' => MessageStatus::Failed,
                    'failed_at' => now(),
                    'error_code' => (string) ($data['error_code'] ?? 'PROVIDER_TEMPORARILY_UNAVAILABLE'),
                    'error_message' => (string) ($data['error_message'] ?? 'Send failed.'),
                ]);

                $attempt->update([
                    'finished_at' => now(),
                    'status' => 'failed',
                    'error_code' => $message->error_code,
                    'error_message' => $message->error_message,
                ]);

                MessageStatusEvent::query()->create([
                    'message_id' => $message->id,
                    'status' => MessageStatus::Failed->value,
                ]);

                $this->notifyWebhooks($dispatchWebhook, $message, 'message.failed');
                $this->alertOwnerOfFailure($ownerAlerts, $message);

                return;
            }

            $message->update([
                'status' => MessageStatus::Sent,
                'sent_at' => now(),
                'provider_message_id' => (string) ($data['provider_message_id'] ?? ''),
            ]);

            $attempt->update([
                'finished_at' => now(),
                'status' => 'succeeded',
            ]);

            MessageStatusEvent::query()->create([
                'message_id' => $message->id,
                'status' => MessageStatus::Sent->value,
            ]);

            $this->notifyWebhooks($dispatchWebhook, $message, 'message.sent');
        } catch (Throwable $e) {
            Log::warning('SendWhatsAppMessage failed', [
                'message_ulid' => $this->messageUlid,
                'error' => $e->getMessage(),
            ]);

            $attempt->update([
                'finished_at' => now(),
                'status' => 'failed',
                'error_class' => $e::class,
                'error_message' => 'Provider request failed.',
            ]);

            $isLastAttempt = $this->job !== null && $this->attempts() >= $this->tries;

            if ($isLastAttempt) {
                $message->update([
                    'status' => MessageStatus::Failed,
                    'failed_at' => now(),
                    'error_code' => 'PROVIDER_TEMPORARILY_UNAVAILABLE',
                    'error_message' => 'Provider request failed.',
                ]);

                $this->notifyWebhooks($dispatchWebhook, $message, 'message.failed');
                $this->alertOwnerOfFailure($ownerAlerts, $message);
            } else {
                $message->update([
                    'status' => MessageStatus::Queued,
                ]);
            }

            throw $e;
        }
    }

    private function alertOwnerOfFailure(TenantOwnerAlertService $ownerAlerts, Message $message): void
    {
        $tenant = $message->relationLoaded('tenant')
            ? $message->tenant
            : Tenant::query()->with('owner')->find($message->tenant_id);

        if ($tenant === null) {
            return;
        }

        $to = (string) $message->recipient_e164;
        $code = (string) ($message->error_code ?? 'FAILED');

        $ownerAlerts->alert(
            tenant: $tenant,
            type: 'message.failed',
            title: 'فشل إرسال رسالة',
            body: "تعذر إرسال رسالة إلى {$to}. الرمز: {$code}. راجع صفحة الرسائل.",
            data: [
                'message_id' => $message->ulid,
                'to' => $to,
                'error_code' => $code,
            ],
            dedupeKey: 'message-failed:'.$message->ulid,
        );
    }

    private function notifyWebhooks(DispatchWebhookDelivery $dispatchWebhook, Message $message, string $eventType): void
    {
        $dispatchWebhook->forTenant(
            (int) $message->tenant_id,
            'evt_msg_'.$message->ulid.'_'.$eventType,
            $eventType,
            [
                'event' => $eventType,
                'message_id' => $message->ulid,
                'device_id' => $message->device?->ulid,
                'to' => $message->recipient_e164,
                'status' => $message->status->value,
                'provider_message_id' => $message->provider_message_id,
                'error_code' => $message->error_code,
                'occurred_at' => now()->toIso8601String(),
            ],
        );
    }
}
