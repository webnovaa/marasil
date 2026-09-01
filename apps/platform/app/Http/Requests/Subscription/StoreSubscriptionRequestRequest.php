<?php

declare(strict_types=1);

namespace App\Http\Requests\Subscription;

use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreSubscriptionRequestRequest extends FormRequest
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
            'plan_id' => ['required', 'string', 'size:26', 'exists:plans,ulid'],
            'type' => ['sometimes', 'string', Rule::enum(SubscriptionRequestType::class)],
            'payment_method' => ['nullable', 'string', 'max:60'],
            'payment_reference' => ['nullable', 'string', 'max:120'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:5120'],
            'customer_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
