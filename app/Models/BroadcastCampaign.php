<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BroadcastCampaign extends Model
{
    protected $fillable = [
        'name', 'whatsapp_account_id', 'message_template_id', 'audience_filter', 'default_params',
        'status', 'total_recipients', 'sent_count', 'delivered_count', 'read_count', 'failed_count',
        'batch_id', 'scheduled_at', 'started_at', 'completed_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'audience_filter' => 'array',
            'default_params'  => 'array',
            'scheduled_at'    => 'datetime',
            'started_at'      => 'datetime',
            'completed_at'    => 'datetime',
        ];
    }

    public function whatsappAccount()
    {
        return $this->belongsTo(WhatsappAccount::class);
    }

    public function template()
    {
        return $this->belongsTo(MessageTemplate::class, 'message_template_id');
    }

    public function recipients()
    {
        return $this->hasMany(BroadcastRecipient::class);
    }

    public function progressPercent(): int
    {
        if (! $this->total_recipients) return 0;
        $processed = $this->sent_count + $this->failed_count;
        return (int) round($processed / $this->total_recipients * 100);
    }
}
