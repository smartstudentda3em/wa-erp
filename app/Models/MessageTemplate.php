<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageTemplate extends Model
{
    protected $fillable = [
        'whatsapp_account_id', 'name', 'language', 'category', 'status', 'components', 'created_by',
    ];

    protected function casts(): array
    {
        return ['components' => 'array'];
    }

    public function whatsappAccount()
    {
        return $this->belongsTo(WhatsappAccount::class);
    }
}
