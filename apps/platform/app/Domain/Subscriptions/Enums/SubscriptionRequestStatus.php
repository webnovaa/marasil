<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Enums;

enum SubscriptionRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
}
