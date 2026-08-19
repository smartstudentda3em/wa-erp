<?php

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

        // alias ميدل وير التحقق من توقيع واتساب
        $middleware->alias([
            'whatsapp.signature' => VerifyWhatsAppSignature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // تشخيص مؤقت: اكتب تفاصيل أي استثناء في ملف قابل للقراءة عبر الويب.
        $exceptions->report(function (\Throwable $e) {
            @file_put_contents(
                public_path('_err.log'),
                now()->toDateTimeString() . ' | ' . get_class($e) . ': ' . $e->getMessage()
                . ' @ ' . $e->getFile() . ':' . $e->getLine() . "\n"
                . $e->getTraceAsString() . "\n\n",
                FILE_APPEND
            );
        });
    })->create();
