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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class AcceptMediaMessage
{
    public function __construct(
        private readonly SubscriptionGate $subscriptionGate,
        private readonly EntitlementService $entitlements,
        private readonly PersistAcceptedMessage $persistAcceptedMessage,
        private readonly ResolveMessagingDevice $resolveMessagingDevice,
        private readonly MessageAdmissionService $admission,
    ) {}

    /**
     * @param  array{device_id: string, to: string, type?: string, caption?: string|null, idempotency_key?: string|null}  $data
     * @return array{message: Message, created: bool}
     */
    public function handle(Tenant $tenant, array $data, UploadedFile $file, ?ApiKey $apiKey = null): array
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
        $this->entitlements->assertAllows($subscription, 'messages.media');

        $maxMb = min(16, (int) config('media.max_upload_mb', 16), (int) $subscription->max_media_size_mb);
        $maxBytes = $maxMb * 1024 * 1024;
        if ($file->getSize() !== false && $file->getSize() > $maxBytes) {
            throw new HttpResponseException(
                ApiResponse::error('MEDIA_TOO_LARGE', "File exceeds {$maxMb}MB limit.", 422)
            );
        }

        $mime = (string) ($file->getMimeType() ?? '');
        $allowed = config('media.allowed_mime_types', []);
        if ($mime !== '' && is_array($allowed) && ! in_array($mime, $allowed, true)) {
            throw new HttpResponseException(
                ApiResponse::error('MEDIA_TYPE_INVALID', 'MIME type is not allowed.', 422)
            );
        }

        $device = $this->resolveMessagingDevice->resolve($tenant, $data, $apiKey);
        $admission = $this->admission->assertAllowed($tenant, $data['to'], (string) ($data['category'] ?? 'transactional'));

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

        $type = MessageType::tryFrom($data['type'] ?? 'image') ?? MessageType::Image;
        if ($type !== MessageType::Document && ! str_starts_with($mime, $type->value.'/')) {
            throw new HttpResponseException(
                ApiResponse::error('MEDIA_TYPE_INVALID', 'The file MIME type does not match the requested media type.', 422)
            );
        }
        $extension = $file->guessExtension() ?: 'bin';
        $path = sprintf(
            'tenants/%s/media/%s.%s',
            $tenant->ulid,
            Str::lower((string) Str::ulid()),
            $extension,
        );

        $disk = (string) config('media.disk', 'local');

        try {
            $stored = Storage::disk($disk)->putFileAs(
                dirname($path),
                $file,
                basename($path),
            );
        } catch (Throwable) {
            $disk = 'local';
            $stored = Storage::disk($disk)->putFileAs(
                dirname($path),
                $file,
                basename($path),
            );
        }

        if ($stored === false) {
            throw new HttpResponseException(
                ApiResponse::error('MEDIA_UPLOAD_FAILED', 'Failed to store media file.', 500)
            );
        }

        $mediaPath = $disk.':'.$stored;

        try {
            $message = $this->persistAcceptedMessage->handle(
                $tenant,
                $subscription,
                function () use ($tenant, $device, $apiKey, $data, $idempotencyKey, $type, $mediaPath): Message {
                    $message = Message::query()->create([
                        'tenant_id' => $tenant->id,
                        'device_id' => $device->id,
                        'api_key_id' => $apiKey?->id,
                        'idempotency_key' => $idempotencyKey ?: null,
                        'recipient_e164' => $data['to'],
                        'type' => $type,
                        'media_path' => $mediaPath,
                        'caption' => $data['caption'] ?? null,
                        'status' => MessageStatus::Queued,
                        'queued_at' => now(),
                        'request_id' => 'req_'.Str::lower((string) Str::ulid()),
                    ]);

                    MessageStatusEvent::query()->create([
                        'message_id' => $message->id,
                        'status' => MessageStatus::Queued->value,
                        'metadata' => ['source' => 'accept_media'],
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

            throw new RuntimeException('Failed to accept media message.', previous: $e);
        }

        return ['message' => $message, 'created' => true];
    }
}
