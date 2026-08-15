@echo off
chcp 65001 >nul
title WhatsApp ERP - Dev (Laravel + Vite)
cd /d "%~dp0"

echo ========================================
echo    WhatsApp ERP - وضع التطوير
echo    Laravel + Vite في نافذة واحدة
echo ========================================
echo.

REM --- فحص وقائي: هل الاعتماديات جاهزة؟ ---
if not exist "package.json" (
    echo [خطأ] لا يوجد ملف package.json في هذا المجلد.
    echo تأكد ان هذا هو مجلد المشروع الصحيح.
    echo.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo [تنبيه] مجلد node_modules غير موجود - سيتم تثبيت الحزم اولا ...
    call npm install
    echo.
)

echo [1/3] تشغيل خادم Laravel على 127.0.0.1:8000 (خلفية نفس النافذة) ...
start /b cmd /c "php artisan serve --host=127.0.0.1 --port=8000"

echo [2/3] فتح المتصفح تلقائيا بعد جهوزية الخدمات ...
REM ping كمؤقّت موثوق (~8 ثوانٍ) ثم فتح المتصفح - كل ذلك في خلفية نفس النافذة
start /b cmd /c "ping -n 9 127.0.0.1 >nul & start http://localhost:8000"

echo [3/3] تشغيل Vite (npm run dev) في المقدمة - ستشاهد التعديلات فورا (HMR).
echo.
echo    اترك هذه النافذة مفتوحة اثناء العمل.
echo    لايقاف كل شيء: اغلق هذه النافذة او اضغط Ctrl+C ثم Y.
echo ----------------------------------------
echo.

REM Vite في مقدمة النافذة (call ضرورية لان npm عبارة عن npm.cmd)
call npm run dev

echo.
echo تم ايقاف Vite. اغلق النافذة لايقاف خادم Laravel ايضا.
pause
