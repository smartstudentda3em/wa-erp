<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestMessage extends Model
{
    protected $fillable = [
        'whatsapp_account_id', 'message_template_id', 'user_id',
        'to_phone', 'variables', 'header_media', 'status', 'wa_message_id', 'error_message',
    ];

    protected function casts(): array
    {
        return ['variables' => 'array'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(MessageTemplate::class, 'message_template_id');
    }

    public function whatsappAccount()
    {
        return $this->belongsTo(WhatsappAccount::class);
    }
}
