<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Platform\Models\PlatformSetting;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AdminAiController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()?->hasPermission('settings.manage'), 403);

        return Inertia::render('Admin/PlatformSettings/Index', [
            'aiMasterEnabled' => PlatformSetting::isAiMasterEnabled(),
        ]);
    }

    public function toggle(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('settings.manage'), 403);

        $enabled = $request->boolean('enabled');
        PlatformSetting::setAiMasterEnabled($enabled);

        $msg = $enabled
            ? 'تم تفعيل مساعد الذكاء الاصطناعي على مستوى المنصة بنجاح.'
            : 'تم إيقاف مساعد الذكاء الاصطناعي على مستوى المنصة مؤقتاً.';

        return back()->with('success', $msg);
    }
}
