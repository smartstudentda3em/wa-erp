<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'direction'   => $this->direction,
            'sender_type' => $this->sender_type,
            'sender'      => $this->whenLoaded('sender', fn () => $this->sender?->name),
            'type'        => $this->type,
            'body'        => $this->body,
            'media_url'   => $this->media_url,
            'media_mime'  => $this->media_mime,
            'status'      => $this->status, // pending|sent|delivered|read|failed|received
            'created_at'  => $this->created_at->toIso8601String(),
        ];
    }
}
