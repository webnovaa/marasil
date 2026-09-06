<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Services;

use App\Domain\Messaging\Models\Message;
use App\Domain\Tenancy\Models\Tenant;

final class DashboardActivity
{
    public function forTenant(?Tenant $tenant): array
    {
        if ($tenant === null) {
            return [];
        }
        $start = now()->startOfDay()->subDays(6);
        $counts = Message::query()->where('tenant_id', $tenant->id)
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupByRaw('DATE(created_at)')->pluck('total', 'day');

        return collect(range(0, 6))->map(function (int $offset) use ($start, $counts): array {
            $date = $start->copy()->addDays($offset)->toDateString();

            return ['date' => $date, 'total' => (int) ($counts[$date] ?? 0)];
        })->all();
    }
}
