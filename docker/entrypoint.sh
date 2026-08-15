#!/bin/sh
set -e
cd /app

# مجلدات التخزين
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 777 storage bootstrap/cache 2>/dev/null || true

# اكتشاف الحزم (يبني bootstrap/cache/packages.php)
php artisan package:discover --ansi >/dev/null 2>&1 || true

# انتظار جاهزية قاعدة البيانات
echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT} ..."
until php -r "new PDO('mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}','${DB_USERNAME}','${DB_PASSWORD}');" >/dev/null 2>&1; do
  echo "  ...still waiting for the database"
  sleep 3
done
echo "MySQL is ready."

exec "$@"
