<?php

declare(strict_types=1);

namespace App\Domain\Identity\Enums;

enum PhoneVerificationPurpose: string
{
    case Registration = 'registration';
    case LoginChallenge = 'login_challenge';
    case PasswordReset = 'password_reset';
    case PhoneChange = 'phone_change';
}
