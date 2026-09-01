<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class PublicMarketingAndAdminPlansTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_and_pricing_render_with_plans(): void
    {
        $this->seed(\Database\Seeders\PlansSeeder::class);

        $this->get('/')->assertOk();
        $this->get('/pricing')->assertOk();
        $this->getJson('/api/v1/plans')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(4, 'data.plans');
    }

    public function test_admin_can_create_and_delete_plan(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        $this->seed(\Database\Seeders\PlansSeeder::class);

        $admin = User::query()->create([
            'phone_e164' => '+963911111111',
            'password' => Hash::make('AdminPass123!'),
            'phone_verified_at' => now(),
            'status' => UserStatus::Active,
            'preferred_locale' => 'ar',
            'timezone' => 'UTC',
            'approved_at' => now(),
        ]);

        $role = Role::query()->where('name', 'super_admin')->firstOrFail();
        $admin->roles()->attach($role->id);

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/v1/plans', [
            'name' => 'خطة اختبار',
            'slug' => 'test-plan',
            'description' => 'للاختبار',
            'price_minor' => 1000,
            'currency' => 'USD',
            'duration_days' => 30,
            'max_devices' => 2,
            'monthly_message_limit' => 500,
            'daily_message_limit_per_device' => 50,
            'max_api_keys' => 2,
            'max_webhooks' => 2,
            'max_media_size_mb' => 8,
            'is_public' => true,
            'is_active' => true,
            'sort_order' => 90,
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.plan.slug', 'test-plan');

        $plan = Plan::query()->where('slug', 'test-plan')->firstOrFail();

        $this->deleteJson('/api/admin/v1/plans/'.$plan->ulid)
            ->assertOk()
            ->assertJsonPath('data.deleted', true);

        $this->assertSoftDeleted('plans', ['id' => $plan->id]);
    }
}
