# إعداد الواجهة (React)

## الحزم المطلوبة
```bash
npm install zustand laravel-echo pusher-js axios react-router-dom
```

## نقطة الدخول والتنقّل
نقطة الدخول [app.jsx](../resources/js/app.jsx) تُعرّف الراوتر، و[AppLayout](../resources/js/layouts/AppLayout.jsx)
يحمّل صلاحيات المستخدم (`/me`) **قبل** عرض الصفحات، ويبني القائمة الجانبية مُخفياً
الروابط حسب الصلاحية:

| الرابط | الشرط |
|---|---|
| المحادثات `/` | الجميع |
| الحملات `/campaigns` | الجميع (الإنشاء داخلها مشروط بـ `campaigns.manage`) |
| إعدادات الحسابات `/settings/accounts` | `accounts.manage` (admin فقط) |

الصفحة الجذر `/` تُصيّر `InboxPage` الذي يحلّ الحساب النشط ذاتياً (أول حساب).

## التحكم بالوصول في الواجهة
```jsx
import { useCan } from './hooks/useCan';
const can = useCan();
{can('conversations.assign') && <TransferControl />}   // زر التحويل
{can('campaigns.manage')     && <NewCampaignButton />}  // إنشاء حملة
{can('accounts.manage')      && <SettingsLink />}       // إعدادات الحسابات
```

## ملاحظات
- كل الطلبات تمرّ عبر `lib/axios.js` مع `withCredentials` (جلسة Sanctum).
- قبل تسجيل الدخول لأول مرة استدعِ `initCsrf()` من `lib/axios.js`.
- الاستماع اللحظي يُفعّل تلقائياً عبر `useRealtimeInbox(accountId)` داخل `InboxPage`.
- متغيّرات `VITE_REVERB_*` يجب أن تكون في `.env` (موجودة في `.env.example`).
- Tailwind CSS مطلوب (يأتي افتراضياً مع Laravel + Vite الحديث).

## بنية المكوّنات
```
pages/InboxPage.jsx                  ← التخطيط ثلاثي الأعمدة
stores/inboxStore.js                 ← الحالة المركزية (Zustand)
hooks/useRealtimeInbox.js            ← ربط Reverb بالمتجر
components/inbox/
  ├─ ConversationList / Item         ← قائمة المحادثات
  ├─ ChatWindow                      ← الرسائل + التبديل بين الكتابة/القوالب
  ├─ MessageBubble + StatusTicks     ← الفقاعات + علامات ✓✓ الملوّنة
  ├─ Composer                        ← نص + رفع وسائط
  ├─ TemplatePicker                  ← يظهر خارج نافذة 24 ساعة
  └─ CustomerPanel                   ← CRM جانبي + إنشاء طلب
components/campaigns/CampaignMonitor  ← شريط تقدّم الحملة اللحظي
```
