<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\ApiKeys\Actions\CreateApiKey;
use App\Domain\Consent\Models\SuppressionEntry;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Messaging\Models\OutboxMessage;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Domain\Tenancy\Enums\TenantStatus;
use App\Domain\Usage\Models\UsageLedgerEntry;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class QuotaAndOutboxTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'whatsapp.internal_hmac_secret' => 'testing-hmac-secret',
            'whatsapp.service_url' => 'http://whatsapp-service.test',
            'otp.pepper' => 'test-pepper',
        ]);

        $this->seed(RolesAndPermissionsSeeder::class);
        Http::fake([
            'whatsapp-service.test/*' => Http::response(['success' => true, 'data' => ['status' => 'sent']], 202),
        ]);
    }

    public function test_device_limit_is_enforced(): void
    {
        [$user] = $this->createTenantUserWithSubscription(maxDevices: 1);

        $this->actingAs($user)
            ->postJson('/api/v1/devices', ['name' => 'First'])
            ->assertCreated();

        $this->actingAs($user)
            ->postJson('/api/v1/devices', ['name' => 'Second'])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'DEVICE_LIMIT_EXCEEDED');
    }

    public function test_message_quota_is_atomic_and_idempotent_replay_does_not_count(): void
    {
        [$user, $tenant] = $this->createTenantUserWithSubscription(monthlyLimit: 1);

        $device = Device::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Sender',
            'status' => DeviceStatus::Connected,
            'provider' => 'baileys',
        ]);

        $created = app(CreateApiKey::class)->handle($tenant, [
            'name' => 'Sender',
            'environment' => 'live',
        ]);

        $payload = [
            'device_id' => $device->ulid,
            'to' => '+963944123456',
            'message' => 'مرحبا',
        ];

        $this->withHeader('Authorization', 'Bearer '.$created['plain_text_key'])
            ->postJson('/api/v1/messages/text', $payload, [
                'Idempotency-Key' => 'order-1',
            ])
            ->assertStatus(202);

        $this->withHeader('Authorization', 'Bearer '.$created['plain_text_key'])
            ->postJson('/api/v1/messages/text', $payload, [
                'Idempotency-Key' => 'order-1',
            ])
            ->assertStatus(202)
            ->assertJsonPath('meta.idempotent_replay', true);

        $this->withHeader('Authorization', 'Bearer '.$created['plain_text_key'])
            ->postJson('/api/v1/messages/text', [
                'device_id' => $device->ulid,
                'to' => '+963944123457',
                'message' => 'ثانية',
            ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MESSAGE_QUOTA_EXCEEDED');

        $this->assertSame(1, UsageLedgerEntry::query()->whereIn('state', ['reserved', 'committed'])->count());
        $this->assertSame(1, OutboxMessage::query()->count());
        $this->assertSame(1, OutboxMessage::query()->where('status', OutboxMessage::STATUS_PUBLISHED)->count());
    }

    public function test_api_key_ability_is_enforced(): void
    {
        [, $tenant] = $this->createTenantUserWithSubscription();

        $device = Device::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Sender',
            'status' => DeviceStatus::Connected,
            'provider' => 'baileys',
        ]);

        $created = app(CreateApiKey::class)->handle($tenant, [
            'name' => 'Read only',
            'environment' => 'live',
            'abilities' => ['messages:read'],
        ]);

        $this->withHeader('Authorization', 'Bearer '.$created['plain_text_key'])
            ->postJson('/api/v1/messages/text', [
                'device_id' => $device->ulid,
                'to' => '+963944123456',
                'message' => 'لا',
            ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'PERMISSION_DENIED');
    }

    public function test_suppressed_recipient_is_rejected(): void
    {
        [, $tenant] = $this->createTenantUserWithSubscription();

        $device = Device::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Sender',
            'status' => DeviceStatus::Connected,
            'provider' => 'baileys',
        ]);

        SuppressionEntry::query()->create([
            'tenant_id' => $tenant->id,
            'recipient_e164' => '+963944123456',
            'reason' => 'opt_out',
        ]);

        $created = app(CreateApiKey::class)->handle($tenant, [
            'name' => 'Sender',
            'environment' => 'live',
        ]);

        $this->withHeader('Authorization', 'Bearer '.$created['plain_text_key'])
            ->postJson('/api/v1/messages/text', [
                'device_id' => $device->ulid,
                'to' => '+963944123456',
                'message' => 'لا',
            ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'RECIPIENT_SUPPRESSED');
    }

    /**
     * @return array{0: User, 1: \App\Domain\Tenancy\Models\Tenant}
     */
    private function createTenantUserWithSubscription(
        string $phone = '+963944123456',
        int $maxDevices = 5,
        int $monthlyLimit = 1000,
    ): array {
        $user = User::factory()->create([
            'phone_e164' => $phone,
            'status' => UserStatus::Active,
        ]);

        $tenant = app(CreateTenantForOwner::class)->handle($user, 'Tenant '.$phone, TenantStatus::Active);

        $plan = Plan::query()->create([
            'name' => 'Starter',
            'slug' => 'starter-'.str_replace('+', '', $phone).'-'.uniqid(),
            'price_minor' => 0,
            'currency' => 'USD',
            'duration_days' => 30,
            'max_devices' => $maxDevices,
            'monthly_message_limit' => $monthlyLimit,
            'daily_message_limit_per_device' => 100,
            'max_api_keys' => 5,
            'max_webhooks' => 2,
            'max_media_size_mb' => 16,
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
            'status' => SubscriptionStatus::Active,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'grace_ends_at' => now()->addMonth()->addDays(3),
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
            'allow_media' => $plan->allow_media,
            'allow_priority_queue' => $plan->allow_priority_queue,
            'allow_team_members' => $plan->allow_team_members,
            'features' => [],
        ]);

        return [$user, $tenant];
    }
}
