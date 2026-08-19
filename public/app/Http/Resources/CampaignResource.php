<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CampaignResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'status'       => $this->status,
            'template'     => $this->whenLoaded('template', fn () => $this->template?->name),
            'account'      => $this->whenLoaded('whatsappAccount', fn () => $this->whatsappAccount?->label),
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'stats'        => [
                'total'     => $this->total_recipients,
                'sent'      => $this->sent_count,
                'delivered' => $this->delivered_count,
                'read'      => $this->read_count,
                'failed'    => $this->failed_count,
                'progress'  => $this->progressPercent(),
            ],
            'created_at'   => $this->created_at->toIso8601String(),
        ];
    }
}
