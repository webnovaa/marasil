<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Billing\Models\PaymentMethod;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class PaymentMethodsPageController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()?->hasPermission('billing.manage'), 403);

        $methods = PaymentMethod::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (PaymentMethod $m) => $m->toPublicArray())
            ->values();

        return Inertia::render('Admin/PaymentMethods/Index', [
            'methods' => $methods,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('billing.manage'), 403);

        $validated = $this->validated($request);

        PaymentMethod::query()->create($validated);

        return back()->with('success', 'تمت إضافة طريقة الدفع.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('billing.manage'), 403);

        $validated = $this->validated($request, $paymentMethod->id);
        $paymentMethod->update($validated);

        return back()->with('success', 'تم تحديث طريقة الدفع.');
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('billing.manage'), 403);

        $paymentMethod->delete();

        return back()->with('success', 'تم حذف طريقة الدفع.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:32',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('payment_methods', 'code')->ignore($ignoreId),
            ],
            'name' => ['required', 'string', 'max:120'],
            'badge' => ['nullable', 'string', 'max:64'],
            'address_or_code' => ['required', 'string', 'max:255'],
            'account_holder' => ['nullable', 'string', 'max:255'],
            'network' => ['nullable', 'string', 'max:64'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'qr_payload' => ['nullable', 'string', 'max:512'],
            'is_enabled' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        $data['code'] = Str::lower((string) $data['code']);
        $data['is_enabled'] = $request->boolean('is_enabled', true);
        $data['sort_order'] = (int) ($data['sort_order'] ?? 100);
        $data['qr_payload'] = $data['qr_payload'] ?: $data['address_or_code'];

        return $data;
    }
}
