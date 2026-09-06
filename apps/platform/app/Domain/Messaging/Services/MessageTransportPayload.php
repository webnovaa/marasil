<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Services;

use App\Domain\Messaging\Enums\MessageType;
use App\Domain\Messaging\Models\Message;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class MessageTransportPayload
{
    public function content(Message $message): array
    {
        if ($message->type === MessageType::Text) {
            return ['text' => $message->content_encrypted];
        }

        if (! in_array($message->type, [MessageType::Image, MessageType::Document, MessageType::Audio, MessageType::Video], true)) {
            throw new RuntimeException('Unsupported message type.');
        }

        [$disk, $path] = array_pad(explode(':', (string) $message->media_path, 2), 2, '');
        if ($disk === '' || $path === '') {
            throw new RuntimeException('Message media is missing.');
        }

        $storage = Storage::disk($disk);
        if ($storage->size($path) > 16 * 1024 * 1024) {
            throw new RuntimeException('Media exceeds the internal transport limit.');
        }
        $bytes = $storage->get($path);
        if (! is_string($bytes) || $bytes === '') {
            throw new RuntimeException('Message media is empty or unavailable.');
        }

        return [
            'type' => $message->type->value,
            'media' => [
                'data' => base64_encode($bytes),
                'mimetype' => $storage->mimeType($path) ?: 'application/octet-stream',
                'filename' => basename($path),
                'caption' => $message->caption ?? '',
            ],
        ];
    }
}
