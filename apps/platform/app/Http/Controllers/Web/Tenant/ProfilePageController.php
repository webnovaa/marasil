<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProfilePageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('profile');

        return Inertia::render('Tenant/Profile/Index', [
            'profile' => [
                'full_name' => $user->profile?->full_name,
                'company_name' => $user->profile?->company_name,
                'phone_e164' => $user->phone_e164,
                'preferred_locale' => $user->preferred_locale,
                'timezone' => $user->timezone,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'company_name' => ['nullable', 'string', 'max:160'],
            'preferred_locale' => ['required', 'in:ar,en'],
            'timezone' => ['required', 'string', 'max:64'],
        ]);

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => $data['full_name'],
                'company_name' => $data['company_name'] ?? null,
            ],
        );

        $user->forceFill([
            'preferred_locale' => $data['preferred_locale'],
            'timezone' => $data['timezone'],
        ])->save();

        $request->session()->put('locale', $data['preferred_locale']);

        return back()->with('success', __('messages.flash.profile_saved'));
    }
}
