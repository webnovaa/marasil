<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Devices\Actions\CreateDevice;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Models\UserProfile;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds a ready-to-test demo tenant + pending approval queues.
 * Credentials are for local/dev only — never use in production.
 */
class DemoDataSeeder extends Seeder
{
    public const DEMO_OWNER_PHONE = '+963900000001';

    public const DEMO_OWNER_PASSWORD = 'DemoPass123!';

    public const PENDING_USER_PHONE = '+963900000002';

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn('Skipping DemoDataSeeder outside local/testing.');

            return;
        }

        DB::transaction(function (): void {
            $owner = $this->seedDemoOwner();
            $tenant = $owner->ownedTenants()->first()
                ?? app(CreateTenantForOwner::class)->handle($owner, 'شركة تجريبية — مراسيل');

            $trial = Plan::query()->where('slug', 'free-trial')->firstOrFail();
            $basic = Plan::query()->where('slug', 'basic')->firstOrFail();

            $this->seedActiveSubscription($tenant->id, $trial, $owner->id);
            $this->seedDemoDevice($tenant);
            $this->seedPendingUser();
            $this->seedPendingSubscriptionRequest($tenant->id, $owner->id, $basic);
        });
    }

    private function seedDemoOwner(): User
    {
        $user = User::query()->updateOrCreate(
            ['phone_e164' => self::DEMO_OWNER_PHONE],
            [
                'password' => Hash::make(self::DEMO_OWNER_PASSWORD),
                'phone_verified_at' => now(),
                'status' => UserStatus::Active,
                'preferred_locale' => 'ar',
                'timezone' => 'Asia/Damascus',
                'approved_at' => now(),
            ],
        );

        UserProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => 'مستخدم تجريبي',
                'company_name' => 'شركة تجريبية — مراسيل',
                'metadata' => ['seeded' => true],
            ],
        );

        $role = Role::query()->where('name', 'tenant_owner')->first();
        if ($role !== null) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }

        return $user;
    }

    private function seedActiveSubscription(int $tenantId, Plan $plan, int $approvedBy): void
    {
        $subscription = Subscription::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SubscriptionStatus::Active)
            ->latest('id')
            ->first();

        if ($subscription !== null && $subscription->ends_at !== null && $subscription->ends_at->isFuture()) {
            return;
        }

        $snapshot = $plan->limitSnapshot();

        $values = [
            'tenant_id' => $tenantId,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
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
            'approved_by' => $approvedBy,
            'auto_renew' => false,
        ];

        if ($subscription !== null) {
            $subscription->update($values);
        } else {
            Subscription::query()->create($values);
        }
    }

    private function seedDemoDevice(\App\Domain\Tenancy\Models\Tenant $tenant): void
    {
        $hasDevice = \App\Domain\Devices\Models\Device::query()
            ->where('tenant_id', $tenant->id)
            ->exists();

        if ($hasDevice) {
            return;
        }

        app(CreateDevice::class)->handle($tenant, [
            'name' => 'جهاز تجريبي',
        ]);
    }

    private function seedPendingUser(): void
    {
        $user = User::query()->updateOrCreate(
            ['phone_e164' => self::PENDING_USER_PHONE],
            [
                'password' => Hash::make('PendingPass123!'),
                'phone_verified_at' => now(),
                'status' => UserStatus::PendingApproval,
                'preferred_locale' => 'ar',
                'timezone' => 'UTC',
                'approved_at' => null,
            ],
        );

        UserProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => 'طلب موافقة تجريبي',
                'company_name' => 'شركة بانتظار الموافقة',
                'metadata' => ['seeded' => true],
            ],
        );
    }

    private function seedPendingSubscriptionRequest(int $tenantId, int $requesterId, Plan $plan): void
    {
        $exists = SubscriptionRequest::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SubscriptionRequestStatus::Pending)
            ->exists();

        if ($exists) {
            return;
        }

        SubscriptionRequest::query()->create([
            'tenant_id' => $tenantId,
            'plan_id' => $plan->id,
            'requested_by' => $requesterId,
            'type' => SubscriptionRequestType::Upgrade,
            'status' => SubscriptionRequestStatus::Pending,
            'customer_note' => 'طلب ترقية تجريبي إلى Basic',
        ]);
    }
}
