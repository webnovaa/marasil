<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Auth;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Models\PhoneVerification;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AuthPageController extends Controller
{
    public function login(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function register(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function verifyOtp(Request $request): Response
    {
        $cooldown = max(1, (int) config('otp.resend_cooldown_seconds', 60));
        $phone = $request->string('phone')->toString();
        $latest = $phone !== ''
            ? PhoneVerification::query()
                ->where('phone_e164', $phone)
                ->where('purpose', PhoneVerificationPurpose::Registration)
                ->latest()
                ->first(['created_at'])
            : null;
        $remaining = $latest !== null
            ? max(0, $cooldown - (int) $latest->created_at->diffInSeconds(now()))
            : 0;

        return Inertia::render('Auth/VerifyOtp', [
            'resendCooldownSeconds' => $cooldown,
            'initialResendSeconds' => $remaining,
        ]);
    }

    public function forgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function resetPassword(): Response
    {
        return Inertia::render('Auth/ResetPassword');
    }
}
