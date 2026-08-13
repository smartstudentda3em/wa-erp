<?php

namespace App\Events;

use App\Models\BroadcastCampaign;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CampaignProgressUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public BroadcastCampaign $campaign) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('campaign.' . $this->campaign->id)];
    }

    public function broadcastAs(): string
    {
        return 'campaign.progress';
    }

    public function broadcastWith(): array
    {
        $c = $this->campaign;

        return [
            'status'    => $c->status,
            'total'     => $c->total_recipients,
            'sent'      => $c->sent_count,
            'delivered' => $c->delivered_count,
            'read'      => $c->read_count,
            'failed'    => $c->failed_count,
            'progress'  => $c->progressPercent(),
        ];
    }
}
