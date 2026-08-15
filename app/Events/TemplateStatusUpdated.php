<?php

namespace App\Events;

use App\Models\MessageTemplate;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند تغيّر حالة قالب من Meta (webhook: message_template_status_update).
 * يبثّ على قناة الحساب لتحديث الواجهة لحظياً.
 */
class TemplateStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public MessageTemplate $template) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('whatsapp.account.' . $this->template->whatsapp_account_id)];
    }

    public function broadcastAs(): string
    {
        return 'template.status';
    }

    public function broadcastWith(): array
    {
        return [
            'id'       => $this->template->id,
            'name'     => $this->template->name,
            'language' => $this->template->language,
            'status'   => $this->template->status, // approved | pending | rejected
        ];
    }
}
