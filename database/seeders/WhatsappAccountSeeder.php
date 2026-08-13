<?php

namespace Database\Seeders;

use App\Models\WhatsappAccount;
use Illuminate\Database\Seeder;

/**
 * يُنشئ/يحدّث حساب واتساب من متغيّرات .env — التوكن لا يُكتب في الكود إطلاقاً.
 * املأ WA_* في .env ثم شغّل:
 *   php artisan db:seed --class=Database\Seeders\WhatsappAccountSeeder
 */
class WhatsappAccountSeeder extends Seeder
{
    public function run(): void
    {
        $phoneNumberId = env('WA_PHONE_NUMBER_ID');

        if (! $phoneNumberId) {
            $this->command->warn('WA_PHONE_NUMBER_ID غير مضبوط في .env — تخطّي.');
            return;
        }

        WhatsappAccount::updateOrCreate(
            ['phone_number_id' => $phoneNumberId],
            [
                'label'                => env('WA_ACCOUNT_LABEL', 'رقم الاختبار'),
                'display_phone_number' => env('WA_DISPLAY_PHONE', ''),
                'waba_id'              => env('WA_WABA_ID', ''),
                'access_token'         => env('WA_ACCESS_TOKEN', ''),
                'webhook_verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
                'daily_limit'          => env('WA_DAILY_LIMIT'),
                'is_active'            => true,
            ]
        );

        $this->command->info('تم إعداد حساب واتساب من .env بنجاح.');
    }
}
