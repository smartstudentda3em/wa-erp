<?php

namespace App\Console\Commands;

use App\Models\WhatsappAccount;
use App\Services\WhatsApp\WhatsAppCloudService;
use Illuminate\Console\Command;
use Throwable;

/**
 * إرسال رسالة قالب تجريبية فعلية عبر Graph API (لاختبار التكامل من الطرفية).
 * مثال (القالب الجاهز على أرقام Meta التجريبية):
 *   php artisan wa:test-send 9665XXXXXXXX hello_world en_US
 */
class SendTestWhatsApp extends Command
{
    protected $signature = 'wa:test-send {to : رقم المستلم E.164} {template=hello_world} {lang=en_US}';

    protected $description = 'إرسال رسالة قالب تجريبية عبر WhatsApp Cloud API';

    public function handle(): int
    {
        $account = WhatsappAccount::where('is_active', true)->first();

        if (! $account) {
            $this->error('لا يوجد حساب واتساب مفعّل. شغّل WhatsappAccountSeeder أولاً.');
            return self::FAILURE;
        }

        $to   = $this->argument('to');
        $name = $this->argument('template');
        $lang = $this->argument('lang');

        $this->info("إرسال القالب [{$name}/{$lang}] إلى {$to} عبر حساب [{$account->label}]...");

        try {
            $res = (new WhatsAppCloudService($account))->sendTemplate($to, $name, $lang, []);
            $id = $res['messages'][0]['id'] ?? '—';
            $this->info("✅ تم الإرسال بنجاح. wa_message_id = {$id}");
            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('❌ فشل الإرسال: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
