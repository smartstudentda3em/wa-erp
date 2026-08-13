<?php

/*
|--------------------------------------------------------------------------
| مقتطف bootstrap/app.php (Laravel 11)
|--------------------------------------------------------------------------
| ادمج ما يلي في ملف bootstrap/app.php الموجود في مشروعك.
| لا تستبدل الملف بالكامل — أضِف فقط الأجزاء الخاصة بهذا النظام:
|   1) تسجيل alias الميدل وير 'whatsapp.signature'
|   2) تفعيل قناة القنوات (channels.php)
| المجدولة معرّفة في routes/console.php (لا تحتاج تسجيلاً هنا في L11).
*/

use App\Http\Middleware\VerifyWhatsAppSignature;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php', // ← فعّل البث
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum SPA: جعل طلبات الـ API stateful
        $middleware->statefulApi();

        // alias ميدل وير التحقق من توقيع واتساب
        $middleware->alias([
            'whatsapp.signature' => VerifyWhatsAppSignature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
