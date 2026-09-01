<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Notifications\Models\InAppNotification;
use Illuminate\Console\Command;

final class PruneNotifications extends Command
{
    protected $signature = 'notifications:prune';

    protected $description = 'Delete read in-app notifications older than 90 days.';

    public function handle(): int
    {
        $deleted = InAppNotification::query()
            ->whereNotNull('read_at')
            ->where('read_at', '<', now()->subDays(90))
            ->delete();

        $this->info("Pruned {$deleted} notification(s).");

        return self::SUCCESS;
    }
}
