<?php

namespace App\Jobs;

use App\Models\BroadcastCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * يُستدعى من المجدول كل دقيقة: يطلق الحملات المجدولة التي حان وقتها.
 */
class DispatchScheduledCampaigns implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        BroadcastCampaign::where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->each(function (BroadcastCampaign $campaign) {
                $campaign->update(['status' => 'queued']);
                DispatchBroadcastCampaign::dispatch($campaign);
            });
    }
}
