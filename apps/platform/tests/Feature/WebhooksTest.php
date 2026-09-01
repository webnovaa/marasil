<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Domain\Tenancy\Enums\TenantStatus;
use App\Domain\Webhooks\Actions\DispatchWebhookDelivery;
use App\Domain\Webhooks\Enums\WebhookEndpointStatus;
use App\Domain\Webhooks\Models\WebhookDelivery;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Domain\Webhooks\Services\WebhookSigner;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class WebhooksTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'otp.pepper' => 'test-pepper',
            'webhooks.require_https' => false,
        ]);

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_webhook_url_with_private_ip_is_rejected(): void
    {
        [$user] = $this->createTenantUserWithSubscription();

        $this->actingAs($user)
            ->postJson('/api/v1/webhooks', [
                'name' => 'Internal',
                'url' => 'http://127.0.0.1/hooks',
                'subscribed_events' => ['message.sent'],
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'WEBHOOK_URL_UNSAFE');

        $this->actingAs($user)
            ->postJson('/api/v1/webhooks', [
                'name' => 'Private LAN',
                'url' => 'http://10.0.0.5/hooks',
                'subscribed_events' => ['message.sent'],
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'WEBHOOK_URL_UNSAFE');
    }

    public function test_webhook_signature_is_deterministic(): void
    {
        $signer = new WebhookSigner;
        $secret = 'whsec_testsecret';
        $id = '01HTESTWEBHOOKDELIVERYID';
        $timestamp = '1700000000';
        $body = '{"event":"message.sent"}';

        $first = $signer->sign($secret, $id, $timestamp, $body);
        $second = $signer->sign($secret, $id, $timestamp, $body);

        $this->assertSame($first, $second);
        $this->assertSame(
            'sha256='.hash_hmac('sha256', $timestamp.'.'.$body, $secret),
            $first['signature'],
        );
        $this->assertSame($id, $first['id']);
        $this->assertSame($timestamp, $first['timestamp']);
    }

    public function test_duplicate_delivery_is_idempotent(): void
    {
        [$user, $tenant] = $this->createTenantUserWithSubscription();

        $endpoint = WebhookEndpoint::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Hook',
            'url' => 'https://example.com/hooks',
            'secret_hash' => hash('sha256', 'whsec_abc'),
            'secret_encrypted' => 'whsec_abc',
            'subscribed_events' => ['message.sent'],
            'status' => WebhookEndpointStatus::Active,
        ]);

        $dispatch = app(DispatchWebhookDelivery::class);

        $first = $dispatch->handle(
            $endpoint,
            'evt_same_001',
            'message.sent',
            ['event' => 'message.sent'],
            queue: false,
        );

        $second = $dispatch->handle(
            $endpoint,
            'evt_same_001',
            'message.sent',
            ['event' => 'message.sent'],
            queue: false,
        );

        $this->assertNotNull($first);
        $this->assertNotNull($second);
        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, WebhookDelivery::query()->where('event_id', 'evt_same_001')->count());
    }

    public function test_webhook_create_returns_secret_once(): void
    {
        [$user] = $this->createTenantUserWithSubscription();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/webhooks', [
                'name' => 'Prod',
                'url' => 'https://example.com/webhooks',
                'subscribed_events' => ['message.sent', 'message.failed'],
            ])
            ->assertCreated()
            ->assertJsonPath('success', true);

        $secret = $response->json('data.webhook.secret');
        $this->assertIsString($secret);
        $this->assertStringStartsWith('whsec_', $secret);

        $this->actingAs($user)
            ->getJson('/api/v1/webhooks')
            ->assertOk()
            ->assertJsonMissing(['secret' => $secret]);
    }

    /**
     * @return array{0: User, 1: \App\Domain\Tenancy\Models\Tenant}
     */
    private function createTenantUserWithSubscription(string $phone = '+963911100010'): array
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
            'max_webhooks' => 5,
            'max_media_size_mb' => 16,
            'allow_media' => true,
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
