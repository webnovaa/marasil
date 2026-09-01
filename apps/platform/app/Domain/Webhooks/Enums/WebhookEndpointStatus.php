<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Enums;

enum WebhookEndpointStatus: string
{
    case Active = 'active';
    case Disabled = 'disabled';
    case Failing = 'failing';
}
