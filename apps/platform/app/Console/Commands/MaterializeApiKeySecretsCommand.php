<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\ApiKeys\Actions\RotateApiKey;
use App\Domain\ApiKeys\Models\ApiKey;
use Illuminate\Console\Command;

final class MaterializeApiKeySecretsCommand extends Command
{
    protected $signature = 'api-keys:materialize-secrets {--dry-run : List keys only}';

    protected $description = 'Rotate active API keys that have no stored secret so they can be shown in the dashboard';

    public function handle(RotateApiKey $rotateApiKey): int
    {
        $keys = ApiKey::query()
            ->whereNull('revoked_at')
            ->whereNull('secret_encrypted')
            ->get();

        if ($keys->isEmpty()) {
            $this->info('All active API keys already have stored secrets.');

            return self::SUCCESS;
        }

        $this->warn("Found {$keys->count()} key(s) without stored secrets.");

        foreach ($keys as $key) {
            $this->line("- {$key->ulid} · {$key->name}");

            if ($this->option('dry-run')) {
                continue;
            }

            $rotateApiKey->handle($key);
            $this->info("  rotated");
        }

        if ($this->option('dry-run')) {
            $this->comment('Run without --dry-run to rotate and store secrets.');
        }

        return self::SUCCESS;
    }
}
