<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\NormalizesWhatsAppPhone;
use App\Rules\WhatsAppE164Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    use NormalizesWhatsAppPhone;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizePhoneField();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:120'],
            'phone_e164' => ['required', 'string', 'max:20', new WhatsAppE164Phone, 'unique:users,phone_e164'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'company_name' => ['nullable', 'string', 'max:160'],
            'preferred_locale' => ['nullable', 'string', 'in:ar,en'],
            'timezone' => ['nullable', 'timezone:all'],
            'terms_accepted' => ['accepted'],
        ];
    }
}
