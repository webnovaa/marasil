<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Support\Auth\HomeDashboard;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class HomeDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_platform_admin_redirects_to_admin_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::query()->where('name', 'admin')->firstOrFail());

        $this->assertSame(HomeDashboard::ADMIN_PATH, HomeDashboard::pathFor($admin));
    }

    public function test_support_agent_redirects_to_admin_dashboard(): void
    {
        $agent = User::factory()->create();
        $agent->roles()->attach(Role::query()->where('name', 'support_agent')->firstOrFail());

        $this->assertSame(HomeDashboard::ADMIN_PATH, HomeDashboard::pathFor($agent));
    }

    public function test_tenant_owner_without_subscription_redirects_to_plans(): void
    {
        $owner = User::factory()->create();
        $owner->roles()->attach(Role::query()->where('name', 'tenant_owner')->firstOrFail());
        app(CreateTenantForOwner::class)->handle($owner, 'Tenant Co');

        $this->assertSame(HomeDashboard::ONBOARDING_PATH, HomeDashboard::pathFor($owner->fresh(['roles'])));
    }

    public function test_tenant_owner_with_active_subscription_redirects_to_tenant_dashboard(): void
    {
        $this->seed(\Database\Seeders\PlansSeeder::class);

        $owner = User::factory()->create();
        $owner->roles()->attach(Role::query()->where('name', 'tenant_owner')->firstOrFail());
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Tenant Co');
        $plan = \App\Domain\Plans\Models\Plan::query()->where('slug', 'free-trial')->firstOrFail();
        $snapshot = $plan->limitSnapshot();

        \App\Domain\Subscriptions\Models\Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => \App\Domain\Subscriptions\Enums\SubscriptionStatus::Active,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(max(1, $plan->duration_days - 1)),
            'grace_ends_at' => now()->addDays($plan->duration_days + 2),
            'plan_name' => $snapshot['plan_name'],
            'plan_slug' => $snapshot['plan_slug'],
            'price_minor' => $snapshot['price_minor'],
            'currency' => $snapshot['currency'],
            'duration_days' => $snapshot['duration_days'],
            'max_devices' => $snapshot['max_devices'],
            'monthly_message_limit' => $snapshot['monthly_message_limit'],
            'daily_message_limit_per_device' => $snapshot['daily_message_limit_per_device'],
            'max_api_keys' => $snapshot['max_api_keys'],
            'max_webhooks' => $snapshot['max_webhooks'],
            'max_media_size_mb' => $snapshot['max_media_size_mb'],
            'allow_media' => $snapshot['allow_media'],
            'allow_priority_queue' => $snapshot['allow_priority_queue'],
            'allow_team_members' => $snapshot['allow_team_members'],
            'features' => $snapshot['features'],
            'approved_by' => $owner->id,
            'auto_renew' => false,
        ]);

        $this->assertSame(HomeDashboard::TENANT_PATH, HomeDashboard::pathFor($owner->fresh(['roles'])));
    }

    public function test_user_without_tenant_redirects_to_plans(): void
    {
        $owner = User::factory()->create();
        $owner->roles()->attach(Role::query()->where('name', 'tenant_owner')->firstOrFail());

        $this->assertSame(HomeDashboard::ONBOARDING_PATH, HomeDashboard::pathFor($owner->fresh(['roles'])));
    }
}
