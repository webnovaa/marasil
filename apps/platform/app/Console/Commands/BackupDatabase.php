<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

final class BackupDatabase extends Command
{
    protected $signature = 'backup:run';

    protected $description = 'Write an encrypted-ready backup manifest and SQLite snapshot when applicable.';

    public function handle(): int
    {
        $stamp = now()->utc()->format('Ymd_His');
        $dir = 'backups/'.$stamp;

        Storage::disk('local')->makeDirectory($dir);

        $connection = (string) config('database.default');
        $database = (string) config("database.connections.{$connection}.database");

        $manifest = [
            'created_at' => now()->utc()->toIso8601String(),
            'connection' => $connection,
            'app' => config('app.name'),
            'notes' => 'Restore drill: restore this snapshot into an isolated environment, run migrations --pretend, then verify tenant isolation queries.',
        ];

        if ($connection === 'sqlite' && $database !== ':memory:' && $database !== '' && File::exists($database)) {
            Storage::disk('local')->put($dir.'/database.sqlite', File::get($database));
            $manifest['artifact'] = 'database.sqlite';
        } else {
            $manifest['artifact'] = null;
            $manifest['hint'] = 'For PostgreSQL use pg_dump from the operations runbook; this command records the drill metadata.';
        }

        Storage::disk('local')->put($dir.'/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $this->info("Backup written to storage/app/{$dir}");

        return self::SUCCESS;
    }
}
