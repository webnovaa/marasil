<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StorePlanRequest extends FormRequest
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
            'slug' => ['nullable', 'string', 'max:120', 'alpha_dash', Rule::unique('plans', 'slug')],
            'description' => ['nullable', 'string', 'max:2000'],
            'price_minor' => ['required', 'integer', 'min:0'],
            'annual_discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'currency' => ['required', 'string', 'size:3'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:3660'],
            'max_devices' => ['required', 'integer', 'min:1', 'max:1000'],
            'monthly_message_limit' => ['required', 'integer', 'min:0'],
            'daily_message_limit_per_device' => ['required', 'integer', 'min:0'],
            'max_api_keys' => ['required', 'integer', 'min:0'],
            'max_webhooks' => ['required', 'integer', 'min:0'],
            'max_media_size_mb' => ['required', 'integer', 'min:1', 'max:512'],
            'allow_media' => ['sometimes', 'boolean'],
            'allow_priority_queue' => ['sometimes', 'boolean'],
            'allow_team_members' => ['sometimes', 'boolean'],
            'features' => ['sometimes', 'array'],
            'features.*' => ['string', 'max:64'],
            'is_public' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
        ];
    }
}
