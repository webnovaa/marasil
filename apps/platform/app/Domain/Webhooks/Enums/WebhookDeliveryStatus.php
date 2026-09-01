<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Enums;

enum WebhookDeliveryStatus: string
{
    case Pending = 'pending';
    case Delivering = 'delivering';
    case Delivered = 'delivered';
    case Failed = 'failed';
    case Abandoned = 'abandoned';
}
