<?php

use Illuminate\Support\Facades\Route;

/*
| الواجهة الأمامية (React SPA).
| أي مسار غير محجوز للـ API/Sanctum/الصحة يُعيد قالب app الذي يحمّل تطبيق React،
| ويتولّى react-router التوجيه داخل المتصفح.
*/
Route::get('/run-setup', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\RoleSeeder', '--force' => true]);
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\UserSeeder', '--force' => true]);
        return 'Setup completed successfully! Roles and Users seeded. Please delete this route for security.';
    } catch (\Exception $e) {
        return 'Error: ' . $e->getMessage();
    }
});

Route::get('/', fn () => view('app'));

Route::get('/{any}', fn () => view('app'))
    ->where('any', '^(?!api|sanctum|up|storage|build|broadcasting).*$');
