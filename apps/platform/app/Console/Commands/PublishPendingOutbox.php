<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Messaging\Jobs\ProcessOutboxMessage;
use App\Domain\Messaging\Models\OutboxMessage;
use Illuminate\Console\Command;

final class PublishPendingOutbox extends Command
{
    protected $signature = 'outbox:publish';

    protected $description = 'Dispatch unpublished outbox rows so accepted messages are not lost if Redis died.';

    public function handle(): int
    {
        $rows = OutboxMessage::query()
            ->where('status', OutboxMessage::STATUS_PENDING)
            ->where(function ($query): void {
                $query->whereNull('available_at')
                    ->orWhere('available_at', '<=', now());
            })
            ->orderBy('id')
            ->limit(100)
            ->get();

        foreach ($rows as $row) {
            ProcessOutboxMessage::dispatch($row->id);
        }

        $this->info('Dispatched '.$rows->count().' outbox row(s).');

        return self::SUCCESS;
    }
}
