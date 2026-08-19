<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'status'          => $this->status,
            'priority'        => $this->priority,
            'unread_count'    => $this->unread_count,
            'last_preview'    => $this->last_message_preview,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'window_open'     => $this->isWindowOpen(), // للواجهة: حقل الكتابة أم القوالب
            'customer'        => new CustomerResource($this->whenLoaded('customer')),
            'assigned_to'     => new UserResource($this->whenLoaded('assignedTo')),
            'account'         => $this->whenLoaded('whatsappAccount', fn () => [
                'id'    => $this->whatsappAccount->id,
                'label' => $this->whatsappAccount->label,
            ]),
        ];
    }
}
