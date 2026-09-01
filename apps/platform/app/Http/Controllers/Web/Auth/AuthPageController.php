<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
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

    public function verifyOtp(): Response
    {
        return Inertia::render('Auth/VerifyOtp');
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
