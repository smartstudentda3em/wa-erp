@echo off
chcp 65001 >nul
title WhatsApp ERP - Launcher
setlocal

REM ============================================================
REM  المشروع القابل للتشغيل (Laravel المثبّت بالكامل) موجود هنا:
REM ============================================================
set "APP_DIR=E:\مذكرات\_run\app"

REM  المسار الكامل لـ PHP (لا يعتمد على PATH)
set "PHP_EXE=C:\Users\surface\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
if not exist "%PHP_EXE%" if exist "C:\xampp\php\php.exe"       set "PHP_EXE=C:\xampp\php\php.exe"
if not exist "%PHP_EXE%" if exist "C:\laragon\bin\php\php.exe" set "PHP_EXE=C:\laragon\bin\php\php.exe"
if not exist "%PHP_EXE%" if exist "C:\php\php.exe"             set "PHP_EXE=C:\php\php.exe"
if not exist "%PHP_EXE%" ( where php >nul 2>nul && set "PHP_EXE=php" )

echo ========================================
echo    WhatsApp ERP - Quick Launch
echo ========================================
echo.

REM  الانتقال لمجلد المشروع الحقيقي
cd /d "%APP_DIR%" 2>nul
if not exist "artisan" (
    echo [ERROR] Laravel project not found at:
    echo   %APP_DIR%
    echo Edit the APP_DIR line in this file to the correct project path.
    echo.
    pause
    exit /b 1
)

echo Using PHP   : %PHP_EXE%
echo Project dir : %cd%
echo.
echo [1/2] Starting Laravel server on 127.0.0.1:8000 ...
start "WhatsApp ERP Server" cmd /k ""%PHP_EXE%" artisan serve --host=127.0.0.1 --port=8000"

echo [2/2] Waiting for the server, then opening the browser ...
timeout /t 3 /nobreak >nul
start "" "http://localhost:8000"

echo.
echo Done. Site opened in your browser.
echo Server runs in the "WhatsApp ERP Server" window. Close it to stop.
echo.
timeout /t 4 /nobreak >nul
exit
