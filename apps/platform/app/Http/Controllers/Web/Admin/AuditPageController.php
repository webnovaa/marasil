<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Audit\Models\AuditLog;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class AuditPageController extends Controller
{
    public function __invoke(): Response
    {
        $logs = AuditLog::query()
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (AuditLog $log): array => [
                'id' => $log->ulid,
                'action' => $log->action,
                'subject_type' => $log->subject_type,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Audit/Index', ['logs' => $logs]);
    }
}
