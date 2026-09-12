<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Jobs;

use App\Domain\Devices\Services\WhatsAppServiceClient;
use App\Domain\Messaging\Enums\MessageStatus;
use App\Domain\Messaging\Enums\MessageType;
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

            $content = app(MessageTransportPayload::class)->content($message);
            if ($message->type === MessageType::Text) {
                $result = $client->sendMessage([
                    'command_id' => 'send_'.$message->ulid,
                    'device_id' => $device->ulid,
                    'tenant_id' => $device->tenant?->ulid,
                    'lease_generation' => $device->lease_generation,
                    'message_id' => $message->ulid,
                    'recipient' => $message->recipient_e164,
                    'text' => $content['text'],
                ]);
            } else {
                [$disk, $path] = array_pad(explode(':', (string) $message->media_path, 2), 2, '');
                $mediaUrl = url(\Illuminate\Support\Facades\Storage::disk($disk)->url($path));
                $result = $client->sendMedia([
                    'command_id' => 'send_media_'.$message->ulid,
                    'device_id' => $device->ulid,
                    'tenant_id' => $device->tenant?->ulid,
                    'lease_generation' => $device->lease_generation,
                    'message_id' => $message->ulid,
                    'recipient' => $message->recipient_e164,
                    'media_type' => $message->type->value,
                    'media_url' => $mediaUrl,
                    'caption' => $message->caption ?? '',
                    'file_name' => $content['media']['filename'] ?? 'attachment',
                    'mimetype' => $content['media']['mimetype'] ?? 'application/octet-stream',
                ]);
            }

            $data = is_array($result['data'] ?? null) ? $result['data'] : $result;
            $status = (string) ($data['status'] ?? 'sent');
            if ($status === 'failed') {
                $errorCode = (string) ($data['error_code'] ?? 'PROVIDER_TEMPORARILY_UNAVAILABLE');
                $errorMessage = match ($errorCode) {
                    'RECIPIENT_NOT_ON_WHATSAPP' => 'الرقم غير مسجل في واتساب (Recipient is not registered on WhatsApp).',
                    default => (string) ($data['error_message'] ?? 'Send failed.'),
                };

                $message->update([
                    'status' => MessageStatus::Failed,
                    'failed_at' => now(),
                    'error_code' => $errorCode,
                    'error_message' => $errorMessage,
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
        $reasonArabic = match ($code) {
            'RECIPIENT_NOT_ON_WHATSAPP' => 'الرقم ليس لديه حساب واتساب نشط',
            'DEVICE_DISCONNECTED' => 'جهاز الإرسال غير متصل بالشبكة',
            'RATE_LIMIT_EXCEEDED' => 'تم تجاوز حد الإرسال المسموح في باقتك',
            default => (string) ($message->error_message ?? 'تعذر الإرسال عبر المزود'),
        };

        $ownerAlerts->alert(
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
