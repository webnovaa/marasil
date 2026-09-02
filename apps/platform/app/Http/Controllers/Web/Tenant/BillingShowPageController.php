<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Billing\Models\Invoice;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BillingShowPageController extends Controller
{
    public function __invoke(Request $request, string $invoiceUlid): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $invoice = Invoice::query()
            ->where('ulid', $invoiceUlid)
            ->where('tenant_id', $tenant->id)
            ->with(['items', 'subscription'])
            ->firstOrFail();

        return Inertia::render('Tenant/Billing/Show', [
            'invoice' => [
                'id' => $invoice->ulid,
                'number' => $invoice->number,
                'status' => $invoice->status,
                'amount_minor' => $invoice->amount_minor,
                'currency' => $invoice->currency,
                'payment_method' => $invoice->payment_method,
                'payment_reference' => $invoice->payment_reference,
                'issued_at' => $invoice->issued_at?->toIso8601String(),
                'paid_at' => $invoice->paid_at?->toIso8601String(),
                'items' => $invoice->items->map(fn ($item) => [
                    'description' => $item->description,
                    'amount_minor' => $item->amount_minor,
                    'quantity' => $item->quantity,
                ])->values()->all(),
            ],
        ]);
    }
}
