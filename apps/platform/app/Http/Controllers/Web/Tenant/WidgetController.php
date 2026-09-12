<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Widget\Models\TenantWidgetSetting;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class WidgetController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'connected')
            ->select(['id', 'ulid', 'display_name', 'phone_e164'])
            ->get();

        $defaultPhone = $devices->first()?->phone_e164 ?? '';

        $setting = TenantWidgetSetting::query()->firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'phone_number' => $defaultPhone,
                'brand_name' => $tenant->name ?: 'خدمة العملاء',
                'greeting_message' => 'مرحباً بك! 👋 كيف يمكننا مساعدتك اليوم عبر واتساب؟',
                'welcome_popup_text' => 'فريقنا متاح للرد الفوري على استفساراتك',
                'button_color' => '#25D366',
                'position' => 'bottom-right',
                'is_active' => true,
            ]
        );

        $scriptUrl = url('/widget.js');

        return Inertia::render('Tenant/Widget/Index', [
            'setting' => $setting,
            'devices' => $devices,
            'scriptUrl' => $scriptUrl,
            'tenantUlid' => $tenant->ulid,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:32'],
            'brand_name' => ['required', 'string', 'max:128'],
            'greeting_message' => ['nullable', 'string', 'max:500'],
            'welcome_popup_text' => ['nullable', 'string', 'max:255'],
            'button_color' => ['required', 'string', 'max:16'],
            'position' => ['required', 'in:bottom-right,bottom-left'],
            'is_active' => ['required', 'boolean'],
        ]);

        $setting = TenantWidgetSetting::query()->firstOrCreate(['tenant_id' => $tenant->id]);
        $setting->update($validated);

        return back()->with('success', 'تم تحديث إعدادات ودجت الواتساب بنجاح!');
    }
}
