<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

final class AdminAiController extends Controller
{
    public function toggle(Request $request): RedirectResponse
    {
        $enabled = $request->boolean('enabled');

        Cache::forever('platform.ai_master_enabled', $enabled);

        $msg = $enabled
            ? 'تم تفعيل مساعد الذكاء الاصطناعي على مستوى المنصة بنجاح.'
            : 'تم إيقاف مساعد الذكاء الاصطناعي على مستوى المنصة مؤقتاً.';

        return back()->with('success', $msg);
    }
}
