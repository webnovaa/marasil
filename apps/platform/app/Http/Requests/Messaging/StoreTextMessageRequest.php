<?php

declare(strict_types=1);

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;

final class StoreTextMessageRequest extends FormRequest
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
            'device_id' => ['sometimes', 'string', 'size:26'],
            'to' => ['required', 'string', 'max:20', 'regex:/^\+[1-9]\d{6,14}$/'],
            'message' => ['required', 'string', 'max:4096'],
            'category' => ['sometimes', 'in:otp,transactional,marketing'],
        ];
    }
}
