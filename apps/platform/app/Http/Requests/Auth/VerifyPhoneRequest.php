<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\NormalizesWhatsAppPhone;
use App\Rules\WhatsAppE164Phone;
use Illuminate\Foundation\Http\FormRequest;

final class VerifyPhoneRequest extends FormRequest
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
            'phone_e164' => ['required', 'string', 'max:20', new WhatsAppE164Phone],
            'code' => ['required', 'string', 'digits_between:4,8'],
        ];
    }
}
