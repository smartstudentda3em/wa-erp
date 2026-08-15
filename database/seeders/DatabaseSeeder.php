<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * نقطة الدخول الافتراضية لأمر: php artisan db:seed
     *
     * الترتيب مهم:
     *   1) RoleSeeder            → الأدوار والصلاحيات (يجب أن تسبق إسناد الأدوار)
     *   2) UserSeeder            → المستخدم الأساسي (99970766) + دور admin
     *   3) WhatsappAccountSeeder → حساب واتساب الافتراضي
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            WhatsappAccountSeeder::class,
        ]);
    }
}
