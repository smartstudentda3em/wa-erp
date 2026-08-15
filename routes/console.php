<?php

use App\Jobs\DispatchScheduledCampaigns;
use App\Jobs\SyncTemplatesJob;
use App\Models\WhatsappAccount;
use Illuminate\Support\Facades\Schedule;

/*
| المجدول (Laravel 11 style). يعمل عبر: php artisan schedule:work
*/

// إطلاق الحملات المجدولة التي حان وقتها — كل دقيقة
Schedule::job(new DispatchScheduledCampaigns)->everyMinute()->withoutOverlapping();

// مزامنة القوالب من Meta لكل الحسابات النشطة — يومياً
Schedule::call(function () {
    WhatsappAccount::where('is_active', true)
        ->each(fn (WhatsappAccount $a) => SyncTemplatesJob::dispatch($a));
})->dailyAt('03:00')->name('sync-whatsapp-templates')->withoutOverlapping();
