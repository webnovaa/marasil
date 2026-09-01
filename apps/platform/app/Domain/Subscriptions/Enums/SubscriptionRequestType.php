<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Enums;

enum SubscriptionRequestType: string
{
    case New = 'new';
    case Renewal = 'renewal';
    case Upgrade = 'upgrade';
    case Downgrade = 'downgrade';
}
