<?php

namespace App\Jobs;

use App\Events\CampaignLimitReached;
use App\Events\CampaignProgressUpdated;
use App\Models\BroadcastRecipient;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsApp\MetaDailyLimitGuard;
use App\Services\WhatsApp\WhatsAppCloudService;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Throwable;

/**
 * يرسل رسالة قالب واحدة لمستلم واحد.
 * - Redis::throttle: يحترم حد المعدّل اللحظي (N/ثانية) لتفادي rate limit من Meta.
 * - MetaDailyLimitGuard: يوقف الحملة عند بلوغ الحد اليومي.
 */
class SendBroadcastMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(public int $recipientId) {}

    public function handle(MetaDailyLimitGuard $guard): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $rate = config('services.whatsapp.broadcast_rate');

        Redis::throttle('whatsapp:broadcast')
            ->allow($rate)->every(1)
            ->then(
                fn () => $this->send($guard),
                fn () => $this->release(2) // تجاوز الحد → أعِد للطابور بعد ثانيتين
            );
    }

    protected function send(MetaDailyLimitGuard $guard): void
    {
        $recipient = BroadcastRecipient::with(['campaign.template', 'campaign.whatsappAccount', 'customer'])
            ->find($this->recipientId);

        if (! $recipient || $recipient->status !== 'pending') {
            return;
        }

        $campaign = $recipient->campaign;
        $account  = $campaign->whatsappAccount;

        // ===== حارس الحد اليومي =====
        if (! $guard->canSend($account)) {
            // أوقف الحملة وألغِ الـ batch حتى لا تُرفض الرسائل
            $campaign->update(['status' => 'paused']);
            $this->batch()?->cancel();
            broadcast(new CampaignLimitReached($campaign->fresh()));
            return;
        }

        // بناء components القالب من المتغيّرات المحلولة
        $components = $this->buildComponents($recipient->variables ?? []);

        try {
            $service  = new WhatsAppCloudService($account);
            $response = $service->sendTemplate(
                $recipient->phone,
                $campaign->template->name,
                $campaign->template->language,
                $components
            );

            $waId    = $response['messages'][0]['id'] ?? null;
            $message = $this->logToConversation($recipient, $waId);

            $recipient->update([
                'wa_message_id' => $waId,
                'message_id'    => $message?->id,
                'status'        => 'sent',
                'sent_at'       => now(),
            ]);

            $campaign->increment('sent_count');
            $guard->record($account->id); // سجّل ضمن العدّاد اليومي

        } catch (Throwable $e) {
            $recipient->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            $campaign->increment('failed_count');
            report($e);
        }

        // بثّ التقدّم كل 5 رسائل لتقليل الضغط على الـ WebSocket
        $processed = $campaign->sent_count + $campaign->failed_count;
        if ($processed % 5 === 0) {
            broadcast(new CampaignProgressUpdated($campaign->fresh()));
        }
    }

    protected function buildComponents(array $vars): array
    {
        if (empty($vars)) {
            return [];
        }

        return [[
            'type'       => 'body',
            'parameters' => collect($vars)
                ->map(fn ($v) => ['type' => 'text', 'text' => (string) $v])
                ->values()
                ->all(),
        ]];
    }

    /** يسجّل رسالة الحملة في شات العميل لتوحيد السجل */
    protected function logToConversation(BroadcastRecipient $r, ?string $waId): ?Message
    {
        $conversation = Conversation::firstOrCreate(
            [
                'whatsapp_account_id' => $r->campaign->whatsapp_account_id,
                'customer_id'         => $r->customer_id,
                'status'              => 'open',
            ],
            ['priority' => 'normal']
        );

        $conversation->update([
            'last_message_at'      => now(),
            'last_message_preview' => "[حملة] {$r->campaign->name}",
            'window_expires_at'    => $conversation->window_expires_at, // القالب لا يفتح النافذة
        ]);

        return $conversation->messages()->create([
            'wa_message_id' => $waId,
            'direction'     => 'outbound',
            'sender_type'   => 'system',
            'type'          => 'template',
            'template_id'   => $r->campaign->message_template_id,
            'body'          => "[حملة] {$r->campaign->name}",
            'status'        => 'sent',
        ]);
    }
}
