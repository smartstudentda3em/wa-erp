<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name', 'phone', 'email', 'company_name', 'assigned_to', 'tags', 'source', 'notes',
    ];

    protected function casts(): array
    {
        return ['tags' => 'array'];
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function interactions()
    {
        return $this->hasMany(CustomerInteraction::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
