<?php

declare(strict_types=1);

namespace App\Domain\Widget\Models;

use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantWidgetSetting extends Model
{
    protected $fillable = [
        'tenant_id',
        'device_id',
        'phone_number',
        'brand_name',
        'greeting_message',
        'welcome_popup_text',
        'button_color',
        'position',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
