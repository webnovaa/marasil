<?php

declare(strict_types=1);

namespace App\Domain\Consent\Services;

use App\Domain\Consent\Models\Consent;
use App\Domain\Consent\Models\QuietHours;
use App\Domain\Consent\Models\SuppressionEntry;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\ApiResponse;
use Carbon\CarbonImmutable;
use Illuminate\Http\Exceptions\HttpResponseException;

final class MessageAdmissionService
{
    /**
     * @return array{available_at: \Carbon\CarbonInterface|null}
     */
    public function assertAllowed(Tenant $tenant, string $recipient, string $category = 'transactional'): array
    {
        $suppressed = SuppressionEntry::query()
            ->where('tenant_id', $tenant->id)
            ->where('recipient_e164', $recipient)
            ->where(function ($query): void {
                $query->whereNull('suppressed_until')
                    ->orWhere('suppressed_until', '>', now());
            })
            ->exists();

        if ($suppressed) {
            throw new HttpResponseException(
                ApiResponse::error('RECIPIENT_SUPPRESSED', 'This recipient is on the suppression list.', 403)
            );
        }

        if ($category === 'marketing') {
            $consent = Consent::query()
                ->where('tenant_id', $tenant->id)
                ->where('recipient_e164', $recipient)
                ->where('category', 'marketing')
                ->where('status', 'granted')
                ->whereNull('revoked_at')
                ->exists();

            if (! $consent) {
                throw new HttpResponseException(
                    ApiResponse::error('CONSENT_REQUIRED', 'Marketing messages require an active consent record.', 403)
                );
            }
        }

        return [
            'available_at' => $this->quietHoursDelay($tenant, $category),
        ];
    }

    private function quietHoursDelay(Tenant $tenant, string $category): ?CarbonImmutable
    {
        if ($category !== 'marketing') {
            return null;
        }

        $hours = QuietHours::query()->where('tenant_id', $tenant->id)->first();

        if ($hours === null || ! $hours->enabled) {
            return null;
        }

        $tz = $hours->timezone ?: 'UTC';
        $now = CarbonImmutable::now($tz);
        $start = $now->setTimeFromTimeString((string) $hours->starts_at);
        $end = $now->setTimeFromTimeString((string) $hours->ends_at);

        $inWindow = $start->lte($end)
            ? $now->betweenIncluded($start, $end)
            : $now->gte($start) || $now->lte($end);

        if (! $inWindow) {
            return null;
        }

        if ($start->gt($end) && $now->gte($start)) {
            return $end->addDay()->utc();
        }

        return $end->utc();
    }
}
