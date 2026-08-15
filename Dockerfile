# ===== WhatsApp ERP — Laravel 11 (PHP 8.4) =====
FROM php:8.4-cli-bookworm

# أدوات النظام + إضافات PHP المطلوبة
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libzip-dev libpng-dev libonig-dev libicu-dev \
    && docker-php-ext-install pdo_mysql mbstring bcmath zip gd intl pcntl opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

# تثبيت تبعيات PHP أولاً (طبقة كاش أفضل)
COPY composer.json composer.lock ./
RUN composer config policy.advisories.block false \
    && composer install --no-dev --no-scripts --prefer-dist --no-interaction --no-progress

# نسخ الكود الكامل (يتضمّن public/build المبنية مسبقاً على المضيف)
COPY . .

RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
