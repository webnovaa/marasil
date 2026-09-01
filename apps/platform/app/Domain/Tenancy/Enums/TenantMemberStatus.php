<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Enums;

enum TenantMemberStatus: string
{
    case Invited = 'invited';
    case Active = 'active';
    case Suspended = 'suspended';
}
