<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsappAccount;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * يعزل كل الاتصال مع Meta WhatsApp Cloud API.
 * كل عملية إرسال/رفع تمر من هنا فقط.
 */
class WhatsAppCloudService
{
    public function __construct(protected WhatsappAccount $account) {}

    protected function baseUrl(): string
    {
        $base = config('services.whatsapp.graph_base');
        $v    = config('services.whatsapp.graph_version');
        return "{$base}/{$v}/{$this->account->phone_number_id}";
    }

    protected function http(): PendingRequest
    {
        return Http::withToken($this->account->access_token)
                   ->acceptJson()
                   ->timeout(15);
    }

    /** إرسال رسالة نصية حرة (تعمل داخل نافذة 24 ساعة فقط) */
    public function sendText(string $to, string $body): array
    {
        $res = $this->http()->post($this->baseUrl() . '/messages', [
            'messaging_product' => 'whatsapp',
            'to'                => $to,
            'type'              => 'text',
            'text'              => ['body' => $body],
        ]);

        $res->throw();
        return $res->json();
    }

    /** إرسال قالب معتمد (يعمل حتى خارج نافذة 24 ساعة) */
    public function sendTemplate(string $to, string $templateName, string $lang, array $components = []): array
    {
        $res = $this->http()->post($this->baseUrl() . '/messages', [
            'messaging_product' => 'whatsapp',
            'to'                => $to,
            'type'              => 'template',
            'template'          => [
                'name'       => $templateName,
                'language'   => ['code' => $lang],
                'components' => $components,
            ],
        ]);

        $res->throw();
        return $res->json();
    }

    /** إرسال وسائط عبر media_id مرفوع مسبقاً */
    public function sendMedia(string $to, string $type, string $mediaId, ?string $caption = null): array
    {
        $res = $this->http()->post($this->baseUrl() . '/messages', [
            'messaging_product' => 'whatsapp',
            'to'                => $to,
            'type'              => $type, // image | document | video | audio
            $type               => array_filter(['id' => $mediaId, 'caption' => $caption]),
        ]);

        $res->throw();
        return $res->json();
    }

    /** رفع ملف إلى Meta والحصول على media_id */
    public function uploadMedia(string $path, string $mime): string
    {
        $res = Http::withToken($this->account->access_token)
            ->attach('file', file_get_contents($path), basename($path), ['Content-Type' => $mime])
            ->post($this->baseUrl() . '/media', [
                'messaging_product' => 'whatsapp',
                'type'              => $mime,
            ]);

        $res->throw();
        return $res->json('id');
    }

    /** جلب رابط وسائط طازج من media_id (روابط Meta مؤقتة الصلاحية) */
    public function fetchMediaUrl(string $mediaId): ?string
    {
        $base = config('services.whatsapp.graph_base');
        $v    = config('services.whatsapp.graph_version');
        $res  = $this->http()->get("{$base}/{$v}/{$mediaId}");

        return $res->json('url');
    }

    /** جلب القوالب من Meta (على مستوى WABA) — مع دعم الصفحات (pagination) */
    public function fetchTemplates(): array
    {
        $base = config('services.whatsapp.graph_base');
        $v    = config('services.whatsapp.graph_version');
        $url  = "{$base}/{$v}/{$this->account->waba_id}/message_templates";

        $templates = [];
        $params = ['limit' => 200];

        do {
            $res = $this->http()->get($url, $params);
            $res->throw();

            $templates = array_merge($templates, $res->json('data', []));

            // متابعة الصفحة التالية إن وُجدت
            $url    = $res->json('paging.next');
            $params = []; // الرابط التالي يحمل معاملاته
        } while ($url);

        return $templates;
    }
}
