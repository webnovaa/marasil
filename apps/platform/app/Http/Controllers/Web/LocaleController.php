<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class LocaleController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'in:ar,en'],
        ]);

        $locale = (string) $validated['locale'];
        $request->session()->put('locale', $locale);

        $user = $request->user();
        if ($user instanceof User) {
            $user->forceFill(['preferred_locale' => $locale])->save();
        }

        return back()->cookie('locale', $locale, 60 * 24 * 365);
    }
}
