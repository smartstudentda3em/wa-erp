<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'phone'        => $this->phone,
            'email'        => $this->email,
            'company_name' => $this->company_name,
            'tags'         => $this->tags,
            'source'       => $this->source,
            'notes'        => $this->notes,
            'assigned_to'  => new UserResource($this->whenLoaded('assignedTo')),
            'interactions' => $this->whenLoaded('interactions', fn () => $this->interactions->map(fn ($i) => [
                'type'        => $i->type,
                'description' => $i->description,
                'created_at'  => $i->created_at->toIso8601String(),
            ])),
            'orders'       => OrderResource::collection($this->whenLoaded('orders')),
        ];
    }
}
