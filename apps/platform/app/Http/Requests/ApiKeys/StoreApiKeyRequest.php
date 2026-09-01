<?php

declare(strict_types=1);

namespace App\Http\Requests\ApiKeys;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreApiKeyRequest extends FormRequest
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
            'environment' => ['sometimes', Rule::in(['live', 'test'])],
            'abilities' => ['sometimes', 'array'],
            'abilities.*' => ['string', 'max:64'],
        ];
    }
}
