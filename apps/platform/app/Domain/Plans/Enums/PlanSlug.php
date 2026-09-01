<?php

declare(strict_types=1);

namespace App\Domain\Plans\Enums;

enum PlanSlug: string
{
    case FreeTrial = 'free-trial';
    case Basic = 'basic';
    case Business = 'business';
    case Professional = 'professional';
}
