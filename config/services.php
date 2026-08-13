<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    | يُدمج هذا الملف مع config/services.php الافتراضي في Laravel.
    | انسخ مفتاح 'whatsapp' إلى ملفك إن كان لديك ملف موجود.
    */

    'whatsapp' => [
        'app_secret'     => env('WHATSAPP_APP_SECRET'),
        'verify_token'   => env('WHATSAPP_VERIFY_TOKEN'),
        'graph_version'  => env('WHATSAPP_GRAPH_VERSION', 'v21.0'),
        'broadcast_rate' => (int) env('WHATSAPP_BROADCAST_RATE', 20), // رسالة/ثانية
        'graph_base'     => 'https://graph.facebook.com',
    ],

];
