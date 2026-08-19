<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappAccount extends Model
{
    protected $fillable = [
        'label', 'display_phone_number', 'phone_number_id', 'waba_id',
        'access_token', 'webhook_verify_token', 'daily_limit', 'messaging_tier', 'is_active',
        'department_id',
    ];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted', // لا يُخزَّن كنص صريح
            'is_active'    => 'boolean',
            'daily_limit'  => 'integer',
        ];
    }

    protected $hidden = ['access_token', 'webhook_verify_token'];

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    /** النشاط/القسم الذي يخدمه هذا الرقم (توجيه حسب المصدر) */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function templates()
    {
        return $this->hasMany(MessageTemplate::class);
    }
}
