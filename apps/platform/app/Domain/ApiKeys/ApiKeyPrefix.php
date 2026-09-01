<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys;

use App\Domain\ApiKeys\Enums\ApiKeyEnvironment;

final class ApiKeyPrefix
{
    public const LIVE = 'mrs_live_';

    public const TEST = 'mrs_test_';

    public static function base(ApiKeyEnvironment $environment): string
    {
        return $environment === ApiKeyEnvironment::Test ? self::TEST : self::LIVE;
    }

    public static function pattern(): string
    {
        return '/^mrs_(live|test)_[a-z0-9]+_[a-z0-9]+$/';
    }
}
