<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Plans\Models\Plan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdatePlanRequest extends FormRequest
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
        /** @var Plan $plan */
        $plan = $this->route('plan');

        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'slug' => [
                'sometimes',
                'string',
                'max:120',
                'alpha_dash',
                Rule::unique('plans', 'slug')->ignore($plan->id),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'price_minor' => ['sometimes', 'integer', 'min:0'],
            'annual_discount_percent' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'duration_days' => ['sometimes', 'integer', 'min:1', 'max:3660'],
            'max_devices' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'monthly_message_limit' => ['sometimes', 'integer', 'min:0'],
            'daily_message_limit_per_device' => ['sometimes', 'integer', 'min:0'],
            'max_api_keys' => ['sometimes', 'integer', 'min:0'],
            'max_webhooks' => ['sometimes', 'integer', 'min:0'],
            'max_media_size_mb' => ['sometimes', 'integer', 'min:1', 'max:512'],
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
