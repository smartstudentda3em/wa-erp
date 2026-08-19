<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsappAccount;
use Illuminate\Support\Facades\Redis;

/**
 * حارس حد Meta اليومي (Messaging Tier).
 * يعدّ الرسائل الصادرة لكل حساب خلال 24 ساعة، ويمنع تجاوز daily_limit
 * لتفادي رفض Meta للرسائل (خصوصاً أثناء الحملات).
 */
class MetaDailyLimitGuard
{
    protected function key(int $accountId): string
    {
        return "wa:daily:{$accountId}:" . now()->format('Ymd');
    }

    /** هل يمكن إرسال رسالة أخرى الآن؟ */
    public function canSend(WhatsappAccount $account): bool
    {
        if (! $account->daily_limit) {
            return true; // لا حد محدد = بلا قيد
        }
        return $this->currentCount($account->id) < $account->daily_limit;
    }

    /** يسجّل إرسال رسالة (increment مع انتهاء صلاحية 48 ساعة) */
    public function record(int $accountId): int
    {
        $key   = $this->key($accountId);
        $count = Redis::incr($key);
        Redis::expire($key, 60 * 60 * 48);
        return (int) $count;
    }

    public function currentCount(int $accountId): int
    {
        return (int) (Redis::get($this->key($accountId)) ?? 0);
    }

    public function remaining(WhatsappAccount $account): ?int
    {
        if (! $account->daily_limit) return null;
        return max(0, $account->daily_limit - $this->currentCount($account->id));
    }
}
