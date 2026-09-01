<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Models\UserProfile;
use App\Domain\Identity\Services\OtpService;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Domain\Tenancy\Enums\TenantStatus;
use Illuminate\Support\Facades\DB;

final class RegisterUser
{
    public function __construct(
        private readonly OtpService $otpService,
        private readonly CreateTenantForOwner $createTenantForOwner,
    ) {}

    /**
     * @param  array{full_name: string, phone_e164: string, password: string, company_name?: string|null, preferred_locale?: string|null, timezone?: string|null}  $data
     * @return array{user: User, tenant_ulid: string}
     */
    public function handle(array $data, ?string $ip = null): array
    {
        return DB::transaction(function () use ($data, $ip): array {
            $user = User::query()->create([
                'phone_e164' => $data['phone_e164'],
                'password' => $data['password'],
                'status' => UserStatus::PendingPhoneVerification,
                'preferred_locale' => $data['preferred_locale'] ?? 'ar',
                'timezone' => $data['timezone'] ?? 'UTC',
            ]);

            UserProfile::query()->create([
                'user_id' => $user->id,
                'full_name' => $data['full_name'],
                'company_name' => $data['company_name'] ?? null,
                'metadata' => [],
            ]);

            $tenantRole = Role::query()->where('name', 'tenant_owner')->first();
            if ($tenantRole !== null) {
                $user->roles()->attach($tenantRole->id);
            }

            $tenant = $this->createTenantForOwner->handle(
                user: $user,
                name: $data['company_name'] ?: $data['full_name'],
                status: TenantStatus::Active,
            );

            $this->otpService->issue(
                phoneE164: $user->phone_e164,
                purpose: PhoneVerificationPurpose::Registration,
                user: $user,
                ip: $ip,
            );

            return [
                'user' => $user->fresh(['profile', 'roles']),
                'tenant_ulid' => $tenant->ulid,
            ];
        });
    }
}
