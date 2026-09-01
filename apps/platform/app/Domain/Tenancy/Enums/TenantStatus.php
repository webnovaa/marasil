<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Enums;

enum TenantStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Suspended = 'suspended';
    case Closed = 'closed';
}
