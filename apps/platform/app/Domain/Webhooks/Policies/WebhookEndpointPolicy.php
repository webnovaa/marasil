<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Policies;

use App\Domain\Identity\Models\User;
use App\Domain\Webhooks\Models\WebhookEndpoint;

final class WebhookEndpointPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->primaryTenant() !== null || $user->isPlatformAdmin();
    }

    public function create(User $user): bool
    {
        return $user->primaryTenant() !== null || $user->isPlatformAdmin();
    }

    public function view(User $user, WebhookEndpoint $endpoint): bool
    {
        return $this->owns($user, $endpoint);
    }

    public function update(User $user, WebhookEndpoint $endpoint): bool
    {
        return $this->owns($user, $endpoint);
    }

    public function delete(User $user, WebhookEndpoint $endpoint): bool
    {
        return $this->owns($user, $endpoint);
    }

    public function rotate(User $user, WebhookEndpoint $endpoint): bool
    {
        return $this->owns($user, $endpoint);
    }

    public function test(User $user, WebhookEndpoint $endpoint): bool
    {
        return $this->owns($user, $endpoint);
    }

    private function owns(User $user, WebhookEndpoint $endpoint): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        $tenant = $user->primaryTenant();

        return $tenant !== null && (int) $tenant->id === (int) $endpoint->tenant_id;
    }
}
