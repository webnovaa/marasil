<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Messaging\Models\Message;

final class MessageResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Message $message): array
    {
        $message->loadMissing('device');

        return [
            'id' => $message->ulid,
            'device_id' => $message->device?->ulid,
            'to' => $message->recipient_e164,
            'type' => $message->type->value,
            'status' => $message->status->value,
            'provider_message_id' => $message->provider_message_id,
            'idempotency_key' => $message->idempotency_key,
            'queued_at' => $message->queued_at?->toIso8601String(),
            'sent_at' => $message->sent_at?->toIso8601String(),
            'failed_at' => $message->failed_at?->toIso8601String(),
            'error_code' => $message->error_code,
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }
}
