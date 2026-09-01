<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Billing\Models\Invoice;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BillingPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        $invoices = $tenant
            ? Invoice::query()
                ->where('tenant_id', $tenant->id)
                ->orderByDesc('id')
                ->limit(50)
                ->get()
                ->map(fn (Invoice $invoice): array => [
                    'id' => $invoice->ulid,
                    'number' => $invoice->number,
                    'status' => $invoice->status,
                    'amount_minor' => $invoice->amount_minor,
                    'currency' => $invoice->currency,
                    'issued_at' => $invoice->issued_at?->toIso8601String(),
                    'paid_at' => $invoice->paid_at?->toIso8601String(),
                ])
            : [];

        return Inertia::render('Tenant/Billing/Index', [
            'invoices' => $invoices,
        ]);
    }
}
