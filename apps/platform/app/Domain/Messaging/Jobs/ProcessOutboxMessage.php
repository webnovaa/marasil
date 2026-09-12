<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Jobs;

use App\Domain\Messaging\Models\OutboxMessage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class ProcessOutboxMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(
        public readonly int $outboxId,
    ) {}

    public function handle(): void
    {
        $outbox = OutboxMessage::query()->whereKey($this->outboxId)->first();

        if ($outbox === null || $outbox->status === OutboxMessage::STATUS_PUBLISHED) {
            return;
        }

        if ($outbox->available_at !== null && $outbox->available_at->isFuture()) {
            return;
        }

        $payload = $outbox->payload;
        $messageUlid = is_array($payload) ? (string) ($payload['message_ulid'] ?? '') : '';

        if ($messageUlid === '') {
            $outbox->update([
                'status' => OutboxMessage::STATUS_FAILED,
                'last_error' => 'Missing message_ulid in payload.',
            ]);

            return;
        }

        $outbox->increment('attempts');
        $outbox->update([
            'status' => OutboxMessage::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);

        SendWhatsAppMessage::dispatch($messageUlid);
    }
}
