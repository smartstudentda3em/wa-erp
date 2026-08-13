<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'whatsapp_account_id', 'customer_id', 'assigned_to', 'status', 'priority',
        'unread_count', 'last_message_preview', 'last_message_at', 'window_expires_at',
        'wa_conversation_id', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at'   => 'datetime',
            'window_expires_at' => 'datetime',
            'closed_at'         => 'datetime',
        ];
    }

    public function whatsappAccount()
    {
        return $this->belongsTo(WhatsappAccount::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function assignments()
    {
        return $this->hasMany(ConversationAssignment::class);
    }

    /** هل نافذة الـ 24 ساعة ما زالت مفتوحة؟ */
    public function isWindowOpen(): bool
    {
        return $this->window_expires_at?->isFuture() ?? false;
    }
}
