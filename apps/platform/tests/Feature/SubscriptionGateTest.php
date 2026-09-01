<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Domain\Tenancy\Enums\TenantStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class SubscriptionGateTest extends TestCase
{
    use RefreshDatabase;

    public function test_gate_allows_active_subscription_and_blocks_expired(): void
    {
        $gate = app(SubscriptionGate::class);
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Gate Tenant', TenantStatus::Active);
        $plan = Plan::query()->create([
            'name' => 'Basic',
            'slug' => 'gate-basic',
            'price_minor' => 1000,
            'currency' => 'USD',
            'duration_days' => 30,
            'max_devices' => 1,
            'monthly_message_limit' => 100,
            'daily_message_limit_per_device' => 10,
            'max_api_keys' => 1,
            'max_webhooks' => 1,
            'max_media_size_mb' => 8,
            'allow_media' => false,
            'allow_priority_queue' => false,
            'allow_team_members' => false,
            'features' => [],
            'is_public' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->assertFalse($gate->forTenant($tenant));

        $active = Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(10),
            'grace_ends_at' => now()->addDays(13),
            'plan_name' => $plan->name,
            'plan_slug' => $plan->slug,
            'price_minor' => $plan->price_minor,
            'currency' => $plan->currency,
            'duration_days' => $plan->duration_days,
            'max_devices' => $plan->max_devices,
            'monthly_message_limit' => $plan->monthly_message_limit,
            'daily_message_limit_per_device' => $plan->daily_message_limit_per_device,
            'max_api_keys' => $plan->max_api_keys,
            'max_webhooks' => $plan->max_webhooks,
            'max_media_size_mb' => $plan->max_media_size_mb,
            'allow_media' => false,
            'allow_priority_queue' => false,
            'allow_team_members' => false,
            'features' => [],
            'auto_renew' => false,
        ]);

        $this->assertTrue($gate->forTenant($tenant));
        $this->assertTrue($gate->isUsable($active));

        $active->forceFill([
            'status' => SubscriptionStatus::Expired,
            'ends_at' => now()->subDays(5),
            'grace_ends_at' => now()->subDay(),
        ])->save();

        $this->assertFalse($gate->forTenant($tenant->fresh()));
        $this->assertFalse($gate->isUsable($active->fresh()));
    }

    public function test_gate_allows_within_grace_period(): void
    {
        $gate = app(SubscriptionGate::class);
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Grace Tenant', TenantStatus::Active);
        $plan = Plan::query()->create([
            'name' => 'Trial',
            'slug' => 'grace-trial',
            'price_minor' => 0,
            'currency' => 'USD',
            'duration_days' => 14,
            'max_devices' => 1,
            'monthly_message_limit' => 50,
            'daily_message_limit_per_device' => 5,
            'max_api_keys' => 1,
            'max_webhooks' => 0,
            'max_media_size_mb' => 8,
            'allow_media' => false,
            'allow_priority_queue' => false,
            'allow_team_members' => false,
            'features' => [],
            'is_public' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Expired,
            'starts_at' => now()->subDays(20),
            'ends_at' => now()->subDay(),
            'grace_ends_at' => now()->addDays(2),
            'plan_name' => $plan->name,
            'plan_slug' => $plan->slug,
            'price_minor' => 0,
            'currency' => 'USD',
            'duration_days' => 14,
            'max_devices' => 1,
            'monthly_message_limit' => 50,
            'daily_message_limit_per_device' => 5,
            'max_api_keys' => 1,
            'max_webhooks' => 0,
            'max_media_size_mb' => 8,
            'allow_media' => false,
            'allow_priority_queue' => false,
            'allow_team_members' => false,
            'features' => [],
            'auto_renew' => false,
        ]);

        $this->assertTrue($gate->forTenant($tenant));
    }

    public function test_ensure_active_subscription_middleware_blocks_expired(): void
    {
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Blocked Tenant', TenantStatus::Active);
        $plan = Plan::query()->create([
            'name' => 'Basic',
            'slug' => 'blocked-basic',
            'price_minor' => 1000,
            'currency' => 'USD',
            'duration_days' => 30,
            'max_devices' => 1,
            'monthly_message_limit' => 100,
            'daily_message_limit_per_device' => 10,
            'max_api_keys' => 1,
            'max_webhooks' => 1,
            'max_media_size_mb' => 8,
            'allow_media' => false,
            'allow_priority_queue' => false,
            'allow_team_members' => false,
            'features' => [],
            'is_public' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Expired,
            'starts_at' => now()->subDays(40),
            'ends_at' => now()->subDays(10),
            'grace_ends_at' => now()->subDays(7),
            'plan_name' => $plan->name,
            'plan_slug' => $plan->slug,
            'price_minor' => 1000,
            'currency' => 'USD',
            'duration_days' => 30,
            'max_devices' => 1,
            'monthly_message_limit' => 100,
            'daily_message_limit_per_device' => 10,
            'max_api_keys' => 1,
            'max_webhooks' => 1,
            'max_media_size_mb' => 8,
            'allow_media' => false,
            'allow_priority_queue' => false,
            'allow_team_members' => false,
            'features' => [],
            'auto_renew' => false,
        ]);

        $this->assertNotNull($owner->fresh()->primaryTenant());
        $this->assertFalse(app(SubscriptionGate::class)->forTenant($tenant));

        Sanctum::actingAs($owner->fresh());

        $this->getJson('/api/v1/devices')
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'SUBSCRIPTION_EXPIRED');
    }

    public function test_health_endpoint_still_works(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('data.status', 'ok');
    }
}
