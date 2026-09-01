<?php

declare(strict_types=1);

namespace App\Http\Requests\Devices;

use Illuminate\Foundation\Http\FormRequest;

final class StoreDeviceRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'settings' => ['sometimes', 'array'],
        ];
    }
}
