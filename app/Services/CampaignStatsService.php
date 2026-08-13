<?php

namespace App\Services;

use App\Events\CampaignProgressUpdated;
use App\Models\BroadcastCampaign;

/**
 * يحدّث عدّادات الحملة عند تغيّر حالة أي مستلم (قادم من الـ Webhook)،
 * ويبثّ التقدّم لحظياً عبر Reverb.
 */
class CampaignStatsService
{
    public function applyTransition(int $campaignId, string $from, string $to): void
    {
        $column = match ($to) {
            'delivered' => 'delivered_count',
            'read'      => 'read_count',
            'failed'    => 'failed_count',
            default     => null,
        };

        if (! $column) {
            return;
        }

        BroadcastCampaign::where('id', $campaignId)->increment($column);

        if ($campaign = BroadcastCampaign::find($campaignId)) {
            broadcast(new CampaignProgressUpdated($campaign));
        }
    }
}
