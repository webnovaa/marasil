<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Identity\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class SetLocale
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $locale = $user instanceof User
            ? (string) ($user->preferred_locale ?: 'ar')
            : (string) ($request->cookie('locale') ?: $request->session()->get('locale', 'ar'));

        if (! in_array($locale, ['ar', 'en'], true)) {
            $locale = 'ar';
        }

        app()->setLocale($locale);
        $request->attributes->set('locale', $locale);
        $request->attributes->set('dir', $locale === 'ar' ? 'rtl' : 'ltr');

        return $next($request);
    }
}
