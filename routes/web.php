<?php

use Illuminate\Support\Facades\Route;

/*
| الواجهة الأمامية (React SPA).
| أي مسار غير محجوز للـ API/Sanctum/الصحة يُعيد قالب app الذي يحمّل تطبيق React،
| ويتولّى react-router التوجيه داخل المتصفح.
*/
Route::get('/', fn () => view('app'));

Route::get('/{any}', fn () => view('app'))
    ->where('any', '^(?!api|sanctum|up|storage|build|broadcasting).*$');
