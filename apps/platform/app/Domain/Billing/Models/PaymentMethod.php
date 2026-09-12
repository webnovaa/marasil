<?php

declare(strict_types=1);

namespace App\Domain\Billing\Models;

use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasUlid;

    protected $fillable = [
        'code',
        'name',
        'badge',
        'address_or_code',
        'account_holder',
        'network',
        'instructions',
        'qr_payload',
        'is_enabled',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return array{id: string, code: string, name: string, badge: string|null, address_or_code: string, account_holder: string|null, network: string|null, instructions: string|null, qr_payload: string, is_enabled: bool, sort_order: int}
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->ulid,
            'code' => $this->code,
            'name' => $this->name,
            'badge' => $this->badge,
            'address_or_code' => $this->address_or_code,
            'account_holder' => $this->account_holder,
            'network' => $this->network,
            'instructions' => $this->instructions,
            'qr_payload' => $this->qr_payload ?: $this->address_or_code,
            'is_enabled' => $this->is_enabled,
            'sort_order' => $this->sort_order,
        ];
    }
}
