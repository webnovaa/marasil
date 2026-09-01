<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Auth;

use App\Domain\Identity\Actions\LogoutUser;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class LogoutController extends Controller
{
    public function __invoke(Request $request, LogoutUser $action): RedirectResponse
    {
        $user = $request->user();
        $action->handle($user instanceof User ? $user : null, $request->ip(), $request->userAgent());

        return redirect('/login');
    }
}
