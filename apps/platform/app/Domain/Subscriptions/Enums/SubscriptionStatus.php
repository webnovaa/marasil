<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Enums;

enum SubscriptionStatus: string
{
    case Scheduled = 'scheduled';
    case Pending = 'pending';
    case Trialing = 'trialing';
    case Active = 'active';
    case Expiring = 'expiring';
    case GracePeriod = 'grace_period';
    case PastDue = 'past_due';
    case Expired = 'expired';
    case Suspended = 'suspended';
    case Cancelled = 'cancelled';
}
