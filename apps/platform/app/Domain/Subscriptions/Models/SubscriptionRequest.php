<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Models;

use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionRequest extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'requested_by',
        'type',
        'billing_cycle',
        'amount_minor',
        'status',
        'payment_method',
        'payment_reference',
        'payment_proof_path',
        'customer_note',
        'admin_note',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'type' => SubscriptionRequestType::class,
            'status' => SubscriptionRequestStatus::class,
            'amount_minor' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
