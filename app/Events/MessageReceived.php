<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('whatsapp.account.' . $this->message->conversation->whatsapp_account_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.received';
    }

    public function broadcastWith(): array
    {
        $m = $this->message;

        return [
            'conversation_id' => $m->conversation_id,
            'message' => [
                'id'          => $m->id,
                'body'        => $m->body,
                'type'        => $m->type,
                'direction'   => $m->direction,
                'sender_type' => $m->sender_type,
                'media_url'   => $m->media_url,
                'status'      => $m->status,
                'created_at'  => $m->created_at->toIso8601String(),
            ],
            'conversation' => [
                'last_message_preview' => $m->conversation->last_message_preview,
                'unread_count'         => $m->conversation->unread_count,
                'assigned_to'          => $m->conversation->assigned_to,
            ],
        ];
    }
}
