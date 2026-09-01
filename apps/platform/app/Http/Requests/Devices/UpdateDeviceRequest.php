<?php

declare(strict_types=1);

namespace App\Http\Requests\Devices;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'settings' => ['sometimes', 'array'],
            'daily_limit_override' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
