<?php

declare(strict_types=1);

namespace App\Http\Requests\Webhooks;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateWebhookRequest extends FormRequest
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
        $allowed = config('webhooks.allowed_events', []);

        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'url' => ['sometimes', 'string', 'url', 'max:2048'],
            'subscribed_events' => ['sometimes', 'array', 'min:1'],
            'subscribed_events.*' => ['string', 'max:64', Rule::in($allowed)],
            'status' => ['sometimes', Rule::in(['active', 'disabled'])],
        ];
    }
}
