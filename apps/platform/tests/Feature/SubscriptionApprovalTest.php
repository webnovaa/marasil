<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Actions\AdminApproveSubscriptionRequest;
use App\Domain\Subscriptions\Actions\CreateSubscriptionRequest;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Models\SubscriptionEvent;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Domain\Tenancy\Enums\TenantStatus;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class SubscriptionApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_approve_creates_active_subscription_with_plan_snapshot(): void
    {
        $admin = $this->makeAdmin();
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'شركة تجريبية', TenantStatus::Active);
        $plan = $this->makePlan(['slug' => 'basic']);

        $request = app(CreateSubscriptionRequest::class)->handle(
            tenant: $tenant,
            requester: $owner,
            plan: $plan,
            type: SubscriptionRequestType::New,
            payment: ['payment_reference' => 'REF-1'],
        );

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/admin/v1/subscription-requests/{$request->ulid}/approve", [
            'admin_note' => 'تمت الموافقة',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.subscription.status', 'active')
            ->assertJsonPath('data.subscription.plan_slug', 'basic')
            ->assertJsonPath('data.subscription.max_devices', 2);

        $this->assertDatabaseHas('subscriptions', [
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active->value,
            'max_devices' => 2,
            'monthly_message_limit' => 5000,
        ]);

        $subscription = Subscription::query()->where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($subscription);
        $this->assertNotNull($subscription->starts_at);
        $this->assertNotNull($subscription->ends_at);
        $this->assertNotNull($subscription->grace_ends_at);
        $this->assertTrue($subscription->grace_ends_at->greaterThan($subscription->ends_at));

        $this->assertDatabaseHas('subscription_events', [
            'subscription_id' => $subscription->id,
            'event_type' => 'subscription.activated',
            'to_status' => SubscriptionStatus::Active->value,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'subscription_request.approved',
            'subject_ulid' => $request->ulid,
        ]);

        $this->assertSame(
            SubscriptionRequest::query()->find($request->id)?->status->value,
            'approved',
        );
    }

    public function test_free_plan_is_auto_approved_without_admin(): void
    {
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Tenant Free', TenantStatus::Active);
        $plan = $this->makePlan(['slug' => 'free-trial', 'price_minor' => 0]);

        $request = app(CreateSubscriptionRequest::class)->handle(
            tenant: $tenant,
            requester: $owner,
            plan: $plan,
        );

        $this->assertSame(SubscriptionRequestStatus::Approved, $request->status);
        $this->assertDatabaseHas('subscriptions', [
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active->value,
        ]);
    }

    public function test_tenant_free_plan_via_api_is_auto_activated(): void
    {
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $owner->roles()->attach(Role::query()->where('name', 'tenant_owner')->firstOrFail());
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Tenant Web', TenantStatus::Active);
        $plan = $this->makePlan(['slug' => 'free-trial', 'price_minor' => 0]);

        Sanctum::actingAs($owner->fresh(['roles']));

        $this->postJson('/api/v1/subscription-requests', [
            'plan_id' => $plan->ulid,
            'type' => 'new',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.auto_activated', true)
            ->assertJsonPath('data.subscription_request.status', 'approved');

        $this->assertDatabaseHas('subscriptions', [
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active->value,
        ]);
    }

    public function test_tenant_paid_plan_via_api_stays_pending_for_admin(): void
    {
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $owner->roles()->attach(Role::query()->where('name', 'tenant_owner')->firstOrFail());
        app(CreateTenantForOwner::class)->handle($owner, 'Tenant Paid', TenantStatus::Active);
        $plan = $this->makePlan(['slug' => 'basic-paid', 'price_minor' => 2900]);

        Sanctum::actingAs($owner->fresh(['roles']));

        $this->postJson('/api/v1/subscription-requests', [
            'plan_id' => $plan->ulid,
            'type' => 'new',
            'payment_reference' => 'REF-123',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.auto_activated', false)
            ->assertJsonPath('data.subscription_request.status', 'pending');

        $this->assertDatabaseHas('subscription_requests', [
            'plan_id' => $plan->id,
            'status' => SubscriptionRequestStatus::Pending->value,
        ]);
    }

    public function test_approve_action_snapshots_limits_in_transaction(): void
    {
        $admin = $this->makeAdmin();
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Tenant B', TenantStatus::Active);
        $plan = $this->makePlan(['max_devices' => 7, 'monthly_message_limit' => 1234]);

        $request = app(CreateSubscriptionRequest::class)->handle(
            tenant: $tenant,
            requester: $owner,
            plan: $plan,
        );

        $subscription = app(AdminApproveSubscriptionRequest::class)->handle($admin, $request);

        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertSame(7, $subscription->max_devices);
        $this->assertSame(1234, $subscription->monthly_message_limit);
        $this->assertSame(1, SubscriptionEvent::query()->where('subscription_id', $subscription->id)->count());
        $this->assertSame(1, AuditLog::query()->where('action', 'subscription_request.approved')->count());
    }

    private function makeAdmin(): User
    {
        $admin = User::factory()->create(['status' => UserStatus::Active]);
        $role = Role::query()->firstOrCreate(
            ['name' => 'super_admin'],
            ['label' => 'Super Admin'],
        );
        $admin->roles()->attach($role);

        return $admin->load('roles');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function makePlan(array $overrides = []): Plan
    {
        return Plan::query()->create(array_merge([
            'name' => 'Basic',
            'slug' => 'basic-'.uniqid(),
            'description' => 'Test plan',
            'price_minor' => 2900,
            'currency' => 'USD',
            'duration_days' => 30,
            'max_devices' => 2,
            'monthly_message_limit' => 5000,
            'daily_message_limit_per_device' => 300,
            'max_api_keys' => 3,
            'max_webhooks' => 3,
            'max_media_size_mb' => 16,
            'allow_media' => true,
            'allow_priority_queue' => false,
            'allow_team_members' => false,
            'features' => ['media'],
            'is_public' => true,
            'is_active' => true,
            'sort_order' => 20,
        ], $overrides));
    }
}
