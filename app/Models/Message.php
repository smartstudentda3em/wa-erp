<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id', 'wa_message_id', 'direction', 'sender_type', 'sender_user_id',
        'type', 'body', 'media_id', 'media_url', 'media_mime', 'template_id',
        'status', 'error_code', 'error_message', 'raw_payload', 'wa_timestamp',
    ];

    protected function casts(): array
    {
        return [
            'raw_payload'  => 'array',
            'wa_timestamp' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function template()
    {
        return $this->belongsTo(MessageTemplate::class, 'template_id');
    }
}
