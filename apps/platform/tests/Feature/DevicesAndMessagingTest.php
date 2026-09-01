<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\ApiKeys\Actions\CreateApiKey;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Domain\Tenancy\Enums\TenantStatus;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class DevicesAndMessagingTest extends TestCase
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
            'whatsapp-service.test/*' => Http::response(['success' => true, 'data' => ['status' => 'ok']], 202),
        ]);
    }

    public function test_api_key_create_returns_secret_once(): void
    {
        [$user] = $this->createTenantUserWithSubscription();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/api-keys', [
                'name' => 'Production',
                'environment' => 'live',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true);

        $secret = $response->json('data.api_key.secret');
        $this->assertIsString($secret);
        $this->assertStringStartsWith('mrs_live_', $secret);

        $ulid = $response->json('data.api_key.id');

        $this->actingAs($user)
            ->getJson('/api/v1/api-keys')
            ->assertOk()
            ->assertJsonMissing(['secret' => $secret])
            ->assertJsonPath('data.api_keys.0.id', $ulid);
    }

    public function test_message_idempotency_returns_same_message(): void
    {
        [$user, $tenant] = $this->createTenantUserWithSubscription();

        $device = Device::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Device A',
            'status' => DeviceStatus::Connected,
            'provider' => 'baileys',
        ]);

        $created = app(CreateApiKey::class)->handle($tenant, [
            'name' => 'Sender',
            'environment' => 'live',
        ]);

        $payload = [
            'device_id' => $device->ulid,
            'to' => '+963911122233',
            'message' => 'مرحبا',
        ];

        $first = $this->withTokenHeader($created['plain_text_key'])
            ->postJson('/api/v1/messages/text', $payload, [
                'Idempotency-Key' => 'order-100',
            ])
            ->assertStatus(202);

        $second = $this->withTokenHeader($created['plain_text_key'])
            ->postJson('/api/v1/messages/text', $payload, [
                'Idempotency-Key' => 'order-100',
            ])
            ->assertStatus(202);

        $this->assertSame(
            $first->json('data.message.id'),
            $second->json('data.message.id'),
        );
        $this->assertTrue((bool) $second->json('meta.idempotent_replay'));
    }

    public function test_tenant_isolation_on_devices(): void
    {
        [$ownerA, $tenantA] = $this->createTenantUserWithSubscription('+963900000001');
        [$ownerB] = $this->createTenantUserWithSubscription('+963900000002');

        $device = Device::query()->create([
            'tenant_id' => $tenantA->id,
            'name' => 'Private device',
            'status' => DeviceStatus::Disconnected,
            'provider' => 'baileys',
        ]);

        $this->actingAs($ownerA)
            ->getJson('/api/v1/devices/'.$device->ulid)
            ->assertOk()
            ->assertJsonPath('data.device.id', $device->ulid);

        $this->actingAs($ownerB)
            ->getJson('/api/v1/devices/'.$device->ulid)
            ->assertForbidden();
    }

    public function test_device_create_provisions_single_integration_key(): void
    {
        [$user, $tenant] = $this->createTenantUserWithSubscription();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/devices', ['name' => 'Shop Bot'])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.integration.username', $tenant->slug)
            ->assertJsonPath('data.integration.device_name', 'Shop Bot');

        $secret = $response->json('data.integration.api_key');
        $this->assertIsString($secret);
        $this->assertStringStartsWith('mrs_live_', $secret);

        $deviceUlid = $response->json('data.device.id');

        $this->actingAs($user)
            ->postJson('/api/v1/devices', ['name' => 'Second Bot'])
            ->assertCreated();

        $this->assertSame(2, \App\Domain\ApiKeys\Models\ApiKey::query()->where('tenant_id', $tenant->id)->whereNull('revoked_at')->count());
    }

    public function test_device_bound_api_key_sends_without_device_id(): void
    {
        [, $tenant] = $this->createTenantUserWithSubscription();

        $device = Device::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Bound Device',
            'status' => DeviceStatus::Connected,
            'provider' => 'baileys',
        ]);

        $created = app(CreateApiKey::class)->handle($tenant, [
            'name' => $device->name,
            'device_id' => $device->id,
        ], deviceBound: true);

        $this->withTokenHeader($created['plain_text_key'])
            ->postJson('/api/v1/messages/text', [
                'to' => '+963911122233',
                'message' => 'مرحبا من جهاز مربوط',
            ])
            ->assertStatus(202)
            ->assertJsonPath('success', true);
    }

    /**
     * @return array{0: User, 1: \App\Domain\Tenancy\Models\Tenant}
     */
    private function createTenantUserWithSubscription(string $phone = '+963911100000'): array
    {
        $user = User::factory()->create([
            'phone_e164' => $phone,
            'status' => UserStatus::Active,
        ]);

        $tenant = app(CreateTenantForOwner::class)->handle($user, 'Tenant '.$phone, TenantStatus::Active);

        $plan = Plan::query()->create([
            'name' => 'Starter',
            'slug' => 'starter-'.str_replace('+', '', $phone),
            'price_minor' => 0,
            'currency' => 'USD',
            'duration_days' => 30,
            'max_devices' => 5,
            'monthly_message_limit' => 1000,
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

    private function withTokenHeader(string $apiKey): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$apiKey);
    }
}
