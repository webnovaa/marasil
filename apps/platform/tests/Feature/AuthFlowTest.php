<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\FakeOtpChannel;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['otp.pepper' => 'test-pepper', 'otp.expose_for_tests' => true]);
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_register_verify_and_login_flow(): void
    {
        $phone = '+963944123456';

        $this->postJson('/api/v1/auth/register', [
            'full_name' => 'مستخدم تجريبي',
            'phone_e164' => $phone,
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
            'company_name' => 'شركة تجريبية',
            'terms_accepted' => true,
        ])->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.status', UserStatus::PendingPhoneVerification->value);

        $code = FakeOtpChannel::peekTestCode($phone, PhoneVerificationPurpose::Registration->value);
        $this->assertNotNull($code);

        $this->postJson('/api/v1/auth/verify-phone', [
            'phone_e164' => $phone,
            'code' => $code,
        ])->assertOk()
            ->assertJsonPath('data.user.status', UserStatus::Active->value)
            ->assertJsonPath('data.redirect_to', '/plans');

        $response = $this->postJson('/api/v1/auth/login', [
            'phone_e164' => $phone,
            'password' => 'Password1!',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.redirect_to', '/plans');
    }

    public function test_authenticated_tenant_user_without_subscription_is_redirected_to_plans(): void
    {
        $user = User::factory()->create(['status' => UserStatus::Active]);
        $user->roles()->attach(Role::query()->where('name', 'tenant_owner')->firstOrFail());
        app(\App\Domain\Tenancy\Actions\CreateTenantForOwner::class)->handle($user, 'Tenant Co');

        $this->actingAs($user->fresh(['roles']))
            ->get('/dashboard')
            ->assertRedirect('/plans');
    }

    public function test_authenticated_admin_is_redirected_to_admin_dashboard(): void
    {
        $admin = User::factory()->create(['status' => UserStatus::Active]);
        $admin->roles()->attach(Role::query()->where('name', 'admin')->firstOrFail());

        $this->actingAs($admin->fresh(['roles']))
            ->get('/dashboard')
            ->assertRedirect('/admin');
    }

    public function test_support_agent_can_open_admin_dashboard(): void
    {
        $agent = User::factory()->create(['status' => UserStatus::Active]);
        $agent->roles()->attach(Role::query()->where('name', 'support_agent')->firstOrFail());

        $this->actingAs($agent->fresh(['roles']))
            ->get('/admin')
            ->assertOk();
    }

    public function test_tenant_user_cannot_open_admin_dashboard(): void
    {
        $user = User::factory()->create(['status' => UserStatus::Active]);
        $user->roles()->attach(Role::query()->where('name', 'tenant_owner')->firstOrFail());
        app(\App\Domain\Tenancy\Actions\CreateTenantForOwner::class)->handle($user, 'Tenant Co');

        $this->actingAs($user->fresh(['roles']))
            ->get('/admin')
            ->assertRedirect('/plans');
    }

    public function test_guest_cannot_access_dashboard(): void
    {
        $this->get('/dashboard')
            ->assertRedirect('/login');
    }

    public function test_tenant_owner_cannot_approve_users(): void
    {
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $ownerRole = Role::query()->where('name', 'tenant_owner')->firstOrFail();
        $owner->roles()->attach($ownerRole->id);

        $pending = User::factory()->pendingApproval()->create();

        $this->actingAs($owner)
            ->postJson('/api/admin/v1/users/'.$pending->ulid.'/approve')
            ->assertForbidden();
    }
}
