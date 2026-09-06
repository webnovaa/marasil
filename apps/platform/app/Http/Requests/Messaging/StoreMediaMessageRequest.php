<?php

declare(strict_types=1);

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreMediaMessageRequest extends FormRequest
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
        $maxMb = min(16, (int) config('media.max_upload_mb', 16));
        $maxKb = $maxMb * 1024;
        $mimes = implode(',', config('media.allowed_mimes', [
            'jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'mp3', 'ogg',
        ]));

        return [
            'device_id' => ['sometimes', 'string', 'size:26'],
            'to' => ['required', 'string', 'max:20', 'regex:/^\+[1-9]\d{6,14}$/'],
            'type' => ['sometimes', Rule::in(['image', 'document', 'audio', 'video'])],
            'caption' => ['sometimes', 'nullable', 'string', 'max:1024'],
            'category' => ['sometimes', 'in:otp,transactional,marketing'],
            'file' => ['required', 'file', 'max:'.$maxKb, 'mimes:'.$mimes],
        ];
    }
}
