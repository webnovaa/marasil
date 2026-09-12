<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\AutoReplies\Models\AutoReply;
use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AutoRepliesController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $autoReplies = AutoReply::query()
            ->where('tenant_id', $tenant->id)
            ->with('device')
            ->latest()
            ->get();

        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'connected')
            ->select(['id', 'ulid', 'display_name', 'phone_e164'])
            ->get();

        return Inertia::render('Tenant/AutoReplies/Index', [
            'autoReplies' => $autoReplies,
            'devices' => $devices,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:128'],
            'device_id' => ['nullable', 'exists:devices,id'],
            'trigger_type' => ['required', 'in:exact,contains,starts_with,welcome'],
            'trigger_keyword' => ['nullable', 'string', 'max:255'],
            'reply_text' => ['required', 'string', 'max:4096'],
        ]);

        AutoReply::query()->create([
            'tenant_id' => $tenant->id,
            'device_id' => $validated['device_id'] ?? null,
            'name' => $validated['name'],
            'trigger_type' => $validated['trigger_type'],
            'trigger_keyword' => $validated['trigger_keyword'] ?? null,
            'reply_text' => $validated['reply_text'],
            'is_active' => true,
        ]);

        return back()->with('success', 'تم إنشاء قاعدة الرد التلقائي بنجاح.');
    }

    public function toggle(AutoReply $autoReply): RedirectResponse
    {
        $autoReply->update(['is_active' => ! $autoReply->is_active]);
        return back()->with('success', 'تم تحديث حالة الرد التلقائي.');
    }

    public function destroy(AutoReply $autoReply): RedirectResponse
    {
        $autoReply->delete();
        return back()->with('success', 'تم حذف قاعدة الرد التلقائي.');
    }
}
