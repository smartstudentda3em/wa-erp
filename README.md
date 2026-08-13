# WhatsApp ERP — نظام ERP + لوحة محادثات واتساب

نظام ERP صغير مدمج مع WhatsApp Business Cloud API، يوفّر لوحة محادثات لحظية
(Omnichannel Inbox)، إدارة عملاء (CRM)، طلبات مبيعات، وحملات رسائل جماعية (Broadcast)،
مبني على **Laravel 11 + React + MySQL + Reverb**.

> ⚠️ هذا المستودع يحتوي **كود التطبيق الذي كتبناه** (Migrations, Models, Controllers,
> Jobs, Events, Services, مكوّنات React). إطار Laravel نفسه (`vendor/`, `artisan`, إلخ)
> يُثبّت عبر `composer` كما في خطوات التشغيل أدناه.

---

## المتطلبات

| الأداة | الإصدار |
|---|---|
| PHP | 8.2+ |
| Composer | 2+ |
| Node.js | 18+ |
| MySQL | 8+ |
| Redis | 6+ (للطوابير والـ Throttling) |

---

## خطوات التشغيل من الصفر

```bash
# 1) أنشئ مشروع Laravel نظيفاً في مجلد مؤقت، ثم انسخ ملفات هذا المستودع فوقه
composer create-project laravel/laravel temp-app
# انسخ محتويات app/ database/ routes/ config/ resources/ من هذا المستودع فوق temp-app

# 2) الحزم المطلوبة
composer require laravel/sanctum laravel/reverb spatie/laravel-permission predis/predis maatwebsite/excel

# 3) الإعداد
cp .env.example .env
php artisan key:generate
php artisan install:api          # Sanctum
php artisan reverb:install       # Reverb
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# 4) قاعدة البيانات
php artisan migrate
php artisan db:seed              # الأدوار والمستخدم الإداري (RoleSeeder)

# 5) الواجهة
npm install
npm run dev

# 6) التشغيل (4 عمليات متوازية)
php artisan serve                # التطبيق
php artisan reverb:start         # خادم WebSocket
php artisan queue:work redis     # معالج الطوابير (Jobs)
php artisan schedule:work        # المجدول (الحملات المجدولة + الحارس)
```

---

## بنية الوحدات (Modules)

1. **CRM** — `Customer`, `CustomerInteraction`
2. **Inbox** — `WhatsappAccount`, `Conversation`, `Message`, `MessageTemplate`
3. **Sales** — `Order`, `OrderItem`, `Product`
4. **Broadcast** — `BroadcastCampaign`, `BroadcastRecipient` (+ جدولة + حارس حد Meta)
5. **RBAC** — Spatie (Admin / Manager / Agent)

---

## المفاهيم المعمارية الأساسية

- **فصل المحادثة عن الرسائل:** المحادثة حاوية لها حالة/مسؤول، والرسائل محتواها.
- **نافذة 24 ساعة:** `conversations.window_expires_at` تفرض استخدام القوالب خارج النافذة.
- **Idempotency:** `messages.wa_message_id` (unique) يمنع تكرار رسائل الـ Webhook.
- **Multi-account:** كل محادثة/قالب مرتبط بـ `whatsapp_account_id`.
- **البث اللحظي:** Events → Reverb → Laravel Echo في React.
- **Broadcast:** `Bus::batch` + `Redis::throttle` لاحترام حدود Meta.

راجع `docs/ARCHITECTURE.md` (إن وُجد) أو تعليقات الكود لتفاصيل كل وحدة.

---

## متغيّرات البيئة المهمة (WhatsApp)

```env
WHATSAPP_APP_SECRET=            # App Secret من Meta (للتحقق من توقيع Webhook)
WHATSAPP_VERIFY_TOKEN=          # اخترته أنت وتضعه في إعداد Webhook بـ Meta
WHATSAPP_GRAPH_VERSION=v21.0
WHATSAPP_BROADCAST_RATE=20      # رسالة/ثانية أثناء الحملات
```

بيانات كل رقم (access_token, phone_number_id, waba_id, daily_limit) تُخزَّن في جدول
`whatsapp_accounts` عبر لوحة الإعدادات، لا في `.env`.
