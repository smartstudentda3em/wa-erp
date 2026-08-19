<?php

namespace App\Jobs;

use App\Events\MessageReceived;
use App\Events\MessageStatusUpdated;
use App\Events\TemplateStatusUpdated;
use App\Models\BroadcastRecipient;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Models\MessageTemplate;
use App\Models\WhatsappAccount;
use App\Services\CampaignStatsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * يعالج حمولة Webhook واتساب في الخلفية:
 * - رسائل واردة → توجيه (حساب + عميل + محادثة) + حفظ + بث.
 * - تحديثات حالة → تحديث الرسالة والمستلمين (للحملات).
 */
class ProcessWhatsAppWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public array $payload) {}

    public function handle(CampaignStatsService $stats): void
    {
        foreach ($this->payload['entry'] ?? [] as $entry) {
            $wabaId = $entry['id'] ?? null; // معرّف الـ WABA (لأحداث القوالب)

            foreach ($entry['changes'] ?? [] as $change) {
                $field = $change['field'] ?? null;
                $value = $change['value'] ?? [];

                // حدث حالة قالب (على مستوى WABA)
                if ($field === 'message_template_status_update') {
                    $this->handleTemplateStatus($wabaId, $value);
                    continue;
                }

                // أحداث الرسائل (على مستوى رقم الهاتف)
                $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;
                $account = WhatsappAccount::where('phone_number_id', $phoneNumberId)->first();
                if (! $account) {
                    continue;
                }

                foreach ($value['messages'] ?? [] as $msg) {
                    $this->handleIncomingMessage($account, $value, $msg);
                }

                foreach ($value['statuses'] ?? [] as $status) {
                    $this->handleStatusUpdate($status, $stats);
                }
            }
        }
    }

    /** تحديث حالة قالب لحظياً من Meta */
    protected function handleTemplateStatus(?string $wabaId, array $value): void
    {
        $account = WhatsappAccount::where('waba_id', $wabaId)->first();
        if (! $account) {
            return;
        }

        $name = $value['message_template_name'] ?? null;
        $lang = $value['message_template_language'] ?? null;
        if (! $name || ! $lang) {
            return;
        }

        $status = $this->mapTemplateEvent($value['event'] ?? null);

        // حدّث الحالة فقط دون المساس بالتصنيف؛ وأنشئ القالب بتصنيف مبدئي إن لم يكن مُزامَناً
        $template = MessageTemplate::firstOrNew([
            'whatsapp_account_id' => $account->id,
            'name'                => $name,
            'language'            => $lang,
        ]);
        $template->status = $status;
        if (! $template->exists) {
            $template->category = 'utility'; // مبدئي — تصحّحه المزامنة الكاملة لاحقاً
        }
        $template->save();

        broadcast(new TemplateStatusUpdated($template));
    }

    /** Meta event: APPROVED|REJECTED|PENDING|PAUSED|DISABLED... → enum لدينا */
    protected function mapTemplateEvent(?string $event): string
    {
        return match (strtoupper((string) $event)) {
            'APPROVED' => 'approved',
            'REJECTED', 'DISABLED' => 'rejected',
            default    => 'pending',
        };
    }

    protected function handleIncomingMessage(WhatsappAccount $account, array $value, array $msg): void
    {
        // 1) Idempotency
        if (Message::where('wa_message_id', $msg['id'])->exists()) {
            return;
        }

        // 2) العميل
        $waId    = $msg['from'];
        $profile = $value['contacts'][0]['profile']['name'] ?? $waId;
        $customer = Customer::firstOrCreate(
            ['phone' => $waId],
            ['name' => $profile, 'source' => 'whatsapp']
        );

        // 3) التوجيه: محادثة مفتوحة لنفس (الحساب + العميل) أو أنشئ جديدة
        $conversation = Conversation::firstOrCreate(
            [
                'whatsapp_account_id' => $account->id,
                'customer_id'         => $customer->id,
                'status'              => 'open',
            ],
            ['priority' => 'normal']
        );

        // 4) استخراج المحتوى
        [$type, $body, $media] = $this->extractContent($msg);

        // 5) حفظ الرسالة
        $message = $conversation->messages()->create([
            'wa_message_id' => $msg['id'],
            'direction'     => 'inbound',
            'sender_type'   => 'customer',
            'type'          => $type,
            'body'          => $body,
            'media_id'      => $media['id']   ?? null,
            'media_mime'    => $media['mime'] ?? null,
            'status'        => 'received',
            'wa_timestamp'  => now()->setTimestamp((int) $msg['timestamp']),
            'raw_payload'   => $msg,
        ]);

        // 6) تحديث المحادثة + إعادة فتح نافذة 24 ساعة
        $conversation->update([
            'last_message_at'      => now(),
            'last_message_preview' => Str::limit($body ?? "[$type]", 60),
            'window_expires_at'    => now()->addHours(24),
            'unread_count'         => $conversation->unread_count + 1,
        ]);

        // 7) بث لحظي
        broadcast(new MessageReceived($message->load('conversation')));
    }

    protected function handleStatusUpdate(array $status, CampaignStatsService $stats): void
    {
        $message = Message::where('wa_message_id', $status['id'])->first();

        if ($message && $message->status !== $status['status']) {
            $message->update([
                'status'        => $status['status'],
                'error_code'    => $status['errors'][0]['code']  ?? null,
                'error_message' => $status['errors'][0]['title'] ?? null,
            ]);
            broadcast(new MessageStatusUpdated($message->load('conversation')));
        }

        // ربط تحديثات الحالة بمستلمي الحملات (إعادة استخدام نفس الآلية)
        $recipient = BroadcastRecipient::where('wa_message_id', $status['id'])->first();
        if ($recipient && $recipient->status !== $status['status']) {
            $old = $recipient->status;
            $recipient->update([
                'status'        => $status['status'],
                'error_code'    => $status['errors'][0]['code']  ?? null,
                'error_message' => $status['errors'][0]['title'] ?? null,
            ]);
            $stats->applyTransition($recipient->broadcast_campaign_id, $old, $status['status']);
        }
    }

    protected function extractContent(array $msg): array
    {
        $type = $msg['type'];

        return match ($type) {
            'text'  => ['text', $msg['text']['body'] ?? null, []],
            'image' => ['image', $msg['image']['caption'] ?? null,
                        ['id' => $msg['image']['id'] ?? null, 'mime' => $msg['image']['mime_type'] ?? null]],
            'document' => ['document', $msg['document']['caption'] ?? $msg['document']['filename'] ?? null,
                        ['id' => $msg['document']['id'] ?? null, 'mime' => $msg['document']['mime_type'] ?? null]],
            'audio' => ['audio', null,
                        ['id' => $msg['audio']['id'] ?? null, 'mime' => $msg['audio']['mime_type'] ?? null]],
            'video' => ['video', $msg['video']['caption'] ?? null,
                        ['id' => $msg['video']['id'] ?? null, 'mime' => $msg['video']['mime_type'] ?? null]],
            'sticker' => ['sticker', null,
                        ['id' => $msg['sticker']['id'] ?? null, 'mime' => $msg['sticker']['mime_type'] ?? null]],
            'location' => ['location',
                        ($msg['location']['latitude'] ?? '') . ',' . ($msg['location']['longitude'] ?? ''), []],
            default => [$type, json_encode($msg[$type] ?? [], JSON_UNESCAPED_UNICODE), []],
        };
    }
}
