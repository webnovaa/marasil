<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Devices\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Device */
final class PlatformDeviceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'phone_e164' => $this->phone_e164,
            'status' => $this->status->value ?? $this->status,
            'avatar_url' => $this->avatar_path !== null
                ? Storage::disk('public')->url($this->avatar_path)
                : null,
            'is_platform' => (bool) $this->is_platform,
            'last_connected_at' => $this->last_connected_at?->toIso8601String(),
            'last_error_code' => $this->last_error_code,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
