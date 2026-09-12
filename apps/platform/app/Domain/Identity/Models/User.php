<?php

declare(strict_types=1);

namespace App\Domain\Identity\Models;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Permission;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Models\TenantMember;
use App\Support\Auth\HomeDashboard;
use App\Support\Concerns\HasUlid;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use HasUlid;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'phone_e164',
        'phone_verified_at',
        'password',
        'status',
        'preferred_locale',
        'timezone',
        'last_login_at',
        'last_login_ip',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
        ];
    }

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    public function tenantMemberships(): HasMany
    {
        return $this->hasMany(TenantMember::class);
    }

    public function ownedTenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'owner_user_id');
    }

    public function authSessions(): HasMany
    {
        return $this->hasMany(AuthSession::class);
    }

    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    public function hasAnyRole(string ...$roles): bool
    {
        return $this->roles->whereIn('name', $roles)->isNotEmpty();
    }

    public function isPlatformAdmin(): bool
    {
        return $this->hasAnyRole('super_admin', 'admin');
    }

    public function isPlatformStaff(): bool
    {
        return $this->hasAnyRole('super_admin', 'admin', 'support_agent');
    }

    public function isTenantUser(): bool
    {
        return $this->hasAnyRole('tenant_owner', 'tenant_member');
    }

    public function canAccessAdminPanel(): bool
    {
        if ($this->isPlatformStaff()) {
            return true;
        }

        return $this->hasAnyPermission([
            'users.view',
            'plans.manage',
            'subscriptions.view',
            'billing.manage',
            'audit.view',
            'support.manage',
        ]);
    }

    public function canAccessTenantArea(): bool
    {
        return $this->primaryTenant() !== null && $this->isTenantUser();
    }

    public function homeDashboardPath(): string
    {
        return HomeDashboard::pathFor($this);
    }

    /**
     * @return list<string>
     */
    public function permissionNames(): array
    {
        if ($this->hasRole('super_admin')) {
            return Permission::query()->pluck('name')->values()->all();
        }

        $this->loadMissing('roles.permissions');

        return $this->roles
            ->flatMap(fn (Role $role) => $role->permissions)
            ->pluck('name')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<string>  $permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->hasRole('super_admin')) {
            return true;
        }

        return $this->roles
            ->loadMissing('permissions')
            ->flatMap(fn (Role $role) => $role->permissions)
            ->contains('name', $permission);
    }

    public function primaryTenant(): ?Tenant
    {
        return $this->ownedTenants()->first()
            ?? $this->tenantMemberships()
                ->where('status', 'active')
                ->with('tenant')
                ->first()
                ?->tenant;
    }

    public function requirePrimaryTenant(): Tenant
    {
        $tenant = $this->primaryTenant();
        abort_if($tenant === null, 403, 'No tenant available.');

        return $tenant;
    }

    /**
     * Controllers historically used $user->tenant; map it to the primary tenant.
     */
    protected function tenant(): Attribute
    {
        return Attribute::get(fn (): ?Tenant => $this->primaryTenant());
    }
}
