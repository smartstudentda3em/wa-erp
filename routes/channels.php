<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
| قنوات البث الخاصة (Reverb). التفويض عبر جلسة Sanctum.
*/

// قناة الحساب: كل الموظفين النشطين يرون محادثاته لحظياً (فريق صغير)
Broadcast::channel('whatsapp.account.{accountId}', function (User $user, $accountId) {
    return $user->is_active;
});

// قناة الحملة: متابعة تقدّم حملة معيّنة
Broadcast::channel('campaign.{campaignId}', function (User $user, $campaignId) {
    return $user->is_active;
});
