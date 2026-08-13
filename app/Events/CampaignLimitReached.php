<?php

namespace App\Events;

use App\Models\BroadcastCampaign;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند بلوغ حد Meta اليومي فتتوقف الحملة تلقائياً، لتنبيه الواجهة.
 */
class CampaignLimitReached implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public BroadcastCampaign $campaign) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('campaign.' . $this->campaign->id)];
    }

    public function broadcastAs(): string
    {
        return 'campaign.limit_reached';
    }

    public function broadcastWith(): array
    {
        return [
            'campaign_id' => $this->campaign->id,
            'status'      => $this->campaign->status,
            'message'     => 'تم بلوغ حد Meta اليومي — أُوقفت الحملة تلقائياً وستُستأنف تلقائياً غداً.',
        ];
    }
}
