<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys\Enums;

enum ApiKeyEnvironment: string
{
    case Live = 'live';
    case Test = 'test';
}
