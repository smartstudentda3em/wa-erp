<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BroadcastRecipient extends Model
{
    protected $fillable = [
        'broadcast_campaign_id', 'customer_id', 'phone', 'variables', 'message_id',
        'wa_message_id', 'status', 'error_code', 'error_message', 'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'sent_at'   => 'datetime',
        ];
    }

    public function campaign()
    {
        return $this->belongsTo(BroadcastCampaign::class, 'broadcast_campaign_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
