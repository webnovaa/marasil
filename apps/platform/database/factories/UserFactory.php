<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'phone_e164' => '+9639'.fake()->unique()->numerify('#######'),
            'phone_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'status' => UserStatus::Active,
            'preferred_locale' => 'ar',
            'timezone' => 'UTC',
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'phone_verified_at' => null,
            'status' => UserStatus::PendingPhoneVerification,
        ]);
    }

    public function pendingApproval(): static
    {
        return $this->state(fn (array $attributes) => [
            'phone_verified_at' => now(),
            'status' => UserStatus::PendingApproval,
        ]);
    }
}
