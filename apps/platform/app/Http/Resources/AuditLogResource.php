<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Audit\Models\AuditLog;

final class AuditLogResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(AuditLog $log): array
    {
        $log->loadMissing(['actor.profile', 'tenant']);

        return [
            'id' => $log->ulid,
            'action' => $log->action,
            'subject_type' => $log->subject_type,
            'subject_ulid' => $log->subject_ulid,
            'before' => $log->before,
            'after' => $log->after,
            'ip_address' => $log->ip_address,
            'request_id' => $log->request_id,
            'created_at' => $log->created_at?->toIso8601String(),
            'actor' => $log->actor ? [
                'id' => $log->actor->ulid,
                'full_name' => $log->actor->profile?->full_name,
                'phone_e164' => $log->actor->phone_e164,
            ] : null,
            'tenant' => $log->tenant ? [
                'id' => $log->tenant->ulid,
                'name' => $log->tenant->name,
            ] : null,
        ];
    }
}
