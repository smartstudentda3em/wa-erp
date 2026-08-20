<?php

use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\VerifyWhatsAppSignature;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum SPA: جعل طلبات الـ API stateful
        $middleware->statefulApi();

        // رؤوس أمان على كل استجابة
        $middleware->append(SecurityHeaders::class);

        // alias ميدل وير التحقق من توقيع واتساب
        $middleware->alias([
            'whatsapp.signature' => VerifyWhatsAppSignature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
