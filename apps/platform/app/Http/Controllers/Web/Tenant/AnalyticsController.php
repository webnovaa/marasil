<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Devices\Models\Device;
use App\Domain\Messaging\Enums\MessageStatus;
use App\Domain\Messaging\Models\InboundMessage;
use App\Domain\Messaging\Models\Message;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $totalOutbound = Message::query()->where('tenant_id', $tenant->id)->count();
        $totalInbound = InboundMessage::query()->where('tenant_id', $tenant->id)->count();

        $delivered = Message::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('status', [MessageStatus::Delivered->value, MessageStatus::Read->value])
            ->count();

        $read = Message::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', MessageStatus::Read->value)
            ->count();

        $failed = Message::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', MessageStatus::Failed->value)
            ->count();

        $deliveryRate = $totalOutbound > 0 ? round(($delivered / $totalOutbound) * 100, 1) : 100.0;
        $readRate = $delivered > 0 ? round(($read / $delivered) * 100, 1) : 0.0;
        $failRate = $totalOutbound > 0 ? round(($failed / $totalOutbound) * 100, 1) : 0.0;

        // 24-Hour Activity Heatmap (Messages sent or received per hour)
        $heatmapHours = [];
        for ($i = 0; $i < 24; $i++) {
            $heatmapHours[$i] = [
                'hour' => sprintf('%02d:00', $i),
                'outbound' => 0,
                'inbound' => 0,
                'total' => 0,
            ];
        }

        $recentOutbounds = Message::query()
            ->where('tenant_id', $tenant->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->select(['id', 'created_at'])
            ->get();

        foreach ($recentOutbounds as $msg) {
            $hour = (int) $msg->created_at->format('G');
            $heatmapHours[$hour]['outbound']++;
            $heatmapHours[$hour]['total']++;
        }

        $recentInbounds = InboundMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->select(['id', 'created_at'])
            ->get();

        foreach ($recentInbounds as $in) {
            $hour = (int) $in->created_at->format('G');
            $heatmapHours[$hour]['inbound']++;
            $heatmapHours[$hour]['total']++;
        }

        // Peak hour
        $peakHour = collect($heatmapHours)->sortByDesc('total')->first();

        // Devices performance
        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->select(['id', 'ulid', 'display_name', 'phone_e164', 'status'])
            ->withCount('messages')
            ->get()
            ->map(fn ($d) => [
                'name' => $d->display_name ?: $d->phone_e164 ?: 'جهاز',
                'phone' => $d->phone_e164,
                'status' => $d->status,
                'messages_count' => $d->messages_count,
            ]);

        // Categories breakdown
        $categories = Message::query()
            ->where('tenant_id', $tenant->id)
            ->selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->all();

        return Inertia::render('Tenant/Analytics/Index', [
            'metrics' => [
                'total_outbound' => $totalOutbound,
                'total_inbound' => $totalInbound,
                'delivery_rate' => $deliveryRate,
                'read_rate' => $readRate,
                'fail_rate' => $failRate,
                'delivered' => $delivered,
                'read' => $read,
                'failed' => $failed,
                'peak_hour' => $peakHour ? $peakHour['hour'] : '12:00',
            ],
            'heatmap' => array_values($heatmapHours),
            'devices' => $devices,
            'categories' => $categories,
        ]);
    }
}
