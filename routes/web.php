<?php

use Illuminate\Support\Facades\Route;

/*
| الواجهة الأمامية (React SPA).
| أي مسار غير محجوز للـ API/Sanctum/الصحة يُعيد قالب app الذي يحمّل تطبيق React،
| ويتولّى react-router التوجيه داخل المتصفح.
*/
Route::get('/run-setup', function () {
    try {
        // 1) أنشئ كل الجداول (users, sessions, cache, jobs, permissions, ...).
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        // 2) الأدوار والمستخدم الإداري.
        \Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\RoleSeeder', '--force' => true]);
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\UserSeeder', '--force' => true]);

        return 'Setup completed successfully! Migrations ran + Roles and Users seeded. '
            . 'Login phone: 99970766 / password: Ayman987654. Please delete this route for security.';
    } catch (\Throwable $e) {
        return 'Error: ' . $e->getMessage();
    }
});

Route::get('/', fn () => view('app'));

Route::get('/{any}', fn () => view('app'))
    ->where('any', '^(?!api|sanctum|up|storage|build|broadcasting).*$');
