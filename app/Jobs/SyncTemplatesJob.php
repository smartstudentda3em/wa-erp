<?php

namespace App\Jobs;

use App\Models\MessageTemplate;
use App\Models\WhatsappAccount;
use App\Services\WhatsApp\WhatsAppCloudService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * يسحب القوالب المعتمدة من Meta ويحدّثها/يضيفها في message_templates.
 * المفتاح المنطقي: (whatsapp_account_id + name + language).
 */
class SyncTemplatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(public WhatsappAccount $account) {}

    public function handle(): void
    {
        try {
            $service = new WhatsAppCloudService($this->account);
            $remote  = $service->fetchTemplates();
        } catch (Throwable $e) {
            report($e);
            return;
        }

        foreach ($remote as $t) {
            if (empty($t['name']) || empty($t['language'])) {
                continue;
            }

            MessageTemplate::updateOrCreate(
                [
                    'whatsapp_account_id' => $this->account->id,
                    'name'                => $t['name'],
                    'language'            => $t['language'],
                ],
                [
                    'category'   => $this->mapCategory($t['category'] ?? null),
                    'status'     => $this->mapStatus($t['status'] ?? null),
                    'components' => $t['components'] ?? [],
                ]
            );
        }
    }

    /** Meta: MARKETING|UTILITY|AUTHENTICATION → enum لدينا */
    protected function mapCategory(?string $c): string
    {
        return match (strtoupper((string) $c)) {
            'AUTHENTICATION' => 'authentication',
            'UTILITY'        => 'utility',
            default          => 'marketing',
        };
    }

    /** Meta: APPROVED|PENDING|REJECTED|PAUSED|DISABLED... → enum لدينا (3 قيم) */
    protected function mapStatus(?string $s): string
    {
        return match (strtoupper((string) $s)) {
            'APPROVED' => 'approved',
            'REJECTED', 'DISABLED' => 'rejected',
            default    => 'pending', // PENDING / PAUSED / IN_APPEAL ...
        };
    }
}
