<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Identity\Models\User as DomainUser;

/**
 * @deprecated Use App\Domain\Identity\Models\User
 */
class User extends DomainUser
{
}
