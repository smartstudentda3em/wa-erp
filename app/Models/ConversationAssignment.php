<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationAssignment extends Model
{
    protected $fillable = ['conversation_id', 'assigned_to', 'assigned_by', 'assigned_at', 'unassigned_at'];

    protected function casts(): array
    {
        return [
            'assigned_at'   => 'datetime',
            'unassigned_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
