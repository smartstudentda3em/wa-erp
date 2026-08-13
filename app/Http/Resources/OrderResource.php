<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'order_number'    => $this->order_number,
            'status'          => $this->status,
            'total_amount'    => $this->total_amount,
            'currency'        => $this->currency,
            'notes'           => $this->notes,
            'conversation_id' => $this->conversation_id,
            'created_at'      => $this->created_at->toIso8601String(),
            'items'           => $this->whenLoaded('items', fn () => $this->items->map(fn ($it) => [
                'product_name' => $it->product_name,
                'quantity'     => $it->quantity,
                'unit_price'   => $it->unit_price,
                'subtotal'     => $it->subtotal,
            ])),
        ];
    }
}
