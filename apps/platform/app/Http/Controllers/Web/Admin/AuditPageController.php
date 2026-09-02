<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Audit\Models\AuditLog;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AuditPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('audit.view'), 403);

        $action = trim((string) $request->query('action', ''));
        $search = trim((string) $request->query('search', ''));

        $query = AuditLog::query()
            ->with(['actor.profile', 'tenant'])
            ->orderByDesc('id');

        if ($action !== '') {
            $query->where('action', 'like', '%'.$action.'%');
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('subject_ulid', 'like', '%'.$search.'%')
                    ->orWhere('request_id', 'like', '%'.$search.'%')
                    ->orWhereHas('actor', fn ($a) => $a->where('phone_e164', 'like', '%'.$search.'%')
                        ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%'.$search.'%')));
            });
        }

        $logs = $query->paginate(30)->withQueryString();

        return Inertia::render('Admin/Audit/Index', [
            'logs' => $logs->getCollection()->map(fn (AuditLog $log) => AuditLogResource::make($log))->values(),
            'filters' => ['action' => $action, 'search' => $search],
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
