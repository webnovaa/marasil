<?php

declare(strict_types=1);

namespace App\Domain\Templates\Services;

use App\Domain\Templates\Models\MessageTemplate;
use App\Support\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;

final class TemplateRenderer
{
    /**
     * @param  array<string, scalar|null>  $values
     */
    public function render(MessageTemplate $template, array $values): string
    {
        $version = $template->currentVersion();

        if ($version === null) {
            throw new HttpResponseException(
                ApiResponse::error('TEMPLATE_NOT_READY', 'Template has no published version.', 422)
            );
        }

        $allowed = $version->variables ?? [];
        if (! is_array($allowed)) {
            $allowed = [];
        }

        $replacements = [];
        foreach ($values as $key => $value) {
            if (! in_array($key, $allowed, true) && $allowed !== []) {
                throw new HttpResponseException(
                    ApiResponse::error('TEMPLATE_VARIABLE_INVALID', "Unknown template variable: {$key}.", 422)
                );
            }

            $replacements['{{'.$key.'}}'] = (string) $value;
        }

        $rendered = strtr($version->body, $replacements);

        if (preg_match('/\{\{[a-zA-Z0-9_]+\}\}/', $rendered) === 1) {
            throw new HttpResponseException(
                ApiResponse::error('TEMPLATE_VARIABLE_MISSING', 'Template is missing required variables.', 422)
            );
        }

        return $rendered;
    }
}
