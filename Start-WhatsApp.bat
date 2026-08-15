@echo off
chcp 65001 >nul
title WhatsApp ERP - Launcher
cd /d "%~dp0"

echo ========================================
echo    WhatsApp ERP - تشغيل
echo ========================================
echo.

echo [1/3] التحقق من Docker ...
docker info >nul 2>&1
if errorlevel 1 (
    echo تشغيل Docker Desktop ...
    start "" "C:\Users\surface\AppData\Local\Programs\DockerDesktop\frontend\Docker Desktop.exe"
    echo انتظر حتى يعمل Docker ثم اعد تشغيل هذا الملف.
    pause
    exit /b 1
)

echo [2/3] تشغيل حاويات WhatsApp ERP ...
docker compose up -d
if errorlevel 1 (
    echo فشل تشغيل الحاويات - راجع الخطأ اعلاه.
    pause
    exit /b 1
)

echo [3/3] انتظار جاهزية التطبيق ثم فتح المتصفح ...
set TRIES=0
:wait
set /a TRIES=%TRIES%+1
if %TRIES% GTR 40 goto timeout
ping -n 3 127.0.0.1 >nul
curl -s -o nul http://localhost:8001/up
if errorlevel 1 goto wait
goto open

:timeout
echo التطبيق لم يستجب في الوقت المتوقع. حالة الحاويات:
docker compose ps
pause
exit /b 1

:open
echo.
echo جاهز - فتح الموقع في المتصفح.
echo   الرابط : http://localhost:8001
echo   الهاتف : 99970766
echo   المرور : Ayman987654
start "" "http://localhost:8001"
ping -n 3 127.0.0.1 >nul
exit
