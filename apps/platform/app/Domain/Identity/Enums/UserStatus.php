<?php

declare(strict_types=1);

namespace App\Domain\Identity\Enums;

enum UserStatus: string
{
    case PendingPhoneVerification = 'pending_phone_verification';
    case PendingApproval = 'pending_approval';
    case Active = 'active';
    case Rejected = 'rejected';
    case Suspended = 'suspended';
    case Disabled = 'disabled';

    public function canLogin(): bool
    {
        return $this === self::Active;
    }
}
