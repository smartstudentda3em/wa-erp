<?php

namespace App\Jobs;

use App\Models\BroadcastCampaign;
use App\Models\BroadcastRecipient;
use App\Services\AudienceResolver;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Throwable;

/**
 * يحضّر الحملة: يبني الجمهور، يحلّ المتغيّرات، ثم يوزّع jobs الإرسال في Bus::batch.
 */
class DispatchBroadcastCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public BroadcastCampaign $campaign) {}

    public function handle(AudienceResolver $audience): void
    {
        $campaign = $this->campaign->fresh();

        if (! in_array($campaign->status, ['queued', 'scheduled'])) {
            return; // أُلغيت أو نُفّذت مسبقاً
        }

        $campaign->update(['status' => 'processing', 'started_at' => now()]);

        // 1) بناء الجمهور
        $customers = $audience->resolve($campaign->audience_filter);

        // 2) صفوف المستلمين + حلّ المتغيّرات (upsert لمنع التكرار)
        $rows = $customers->map(fn ($c) => [
            'broadcast_campaign_id' => $campaign->id,
            'customer_id' => $c->id,
            'phone'       => $c->phone,
            'variables'   => json_encode($this->resolveVariables($campaign->default_params, $c), JSON_UNESCAPED_UNICODE),
            'status'      => 'pending',
            'created_at'  => now(),
            'updated_at'  => now(),
        ])->all();

        if (! empty($rows)) {
            BroadcastRecipient::upsert($rows, ['broadcast_campaign_id', 'customer_id'], ['variables', 'updated_at']);
        }

        $campaign->update(['total_recipients' => count($rows)]);

        // 3) Batch من jobs الإرسال
        $jobs = $campaign->recipients()
            ->where('status', 'pending')
            ->pluck('id')
            ->map(fn ($rid) => new SendBroadcastMessageJob($rid))
            ->all();

        if (empty($jobs)) {
            $campaign->update(['status' => 'completed', 'completed_at' => now()]);
            return;
        }

        $campaignId = $campaign->id;

        $batch = Bus::batch($jobs)
            ->name("campaign-{$campaignId}")
            ->allowFailures()
            ->then(function (Batch $batch) use ($campaignId) {
                BroadcastCampaign::where('id', $campaignId)
                    ->where('status', 'processing')
                    ->update(['status' => 'completed', 'completed_at' => now()]);
            })
            ->finally(function (Batch $batch) use ($campaignId) {
                if ($c = BroadcastCampaign::find($campaignId)) {
                    broadcast(new \App\Events\CampaignProgressUpdated($c));
                }
            })
            ->dispatch();

        // خزّن معرّف الـ batch للتمكّن من الإلغاء لاحقاً
        $campaign->update(['batch_id' => $batch->id]);
    }

    protected function resolveVariables(?array $map, $customer): array
    {
        return collect($map ?? [])
            ->map(fn ($field) => (string) data_get($customer, $field, ''))
            ->toArray();
    }
}
