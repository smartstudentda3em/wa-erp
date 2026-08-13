# إعداد Webhook واتساب (Meta)

## 1) عنوان الـ Callback
في إعدادات تطبيق Meta → WhatsApp → Configuration → Webhook:

```
Callback URL:  https://your-domain.com/api/webhooks/whatsapp
Verify Token:  نفس قيمة WHATSAPP_VERIFY_TOKEN في .env
```

عند الحفظ ترسل Meta طلب `GET` للتحقق — يردّ عليه
[WhatsAppWebhookController@verify](../app/Http/Controllers/Webhooks/WhatsAppWebhookController.php)
بإرجاع `hub_challenge`.

## 2) الحقول المطلوب الاشتراك بها (Webhook Fields)
| الحقل | الغرض | يعالجه |
|---|---|---|
| `messages` | الرسائل الواردة + تحديثات الحالة (delivered/read) | `handleIncomingMessage` / `handleStatusUpdate` |
| `message_template_status_update` | **تغيّر حالة القالب لحظياً** (اعتماد/رفض) | `handleTemplateStatus` |

> ⚠️ بدون الاشتراك في `message_template_status_update` لن تصل تحديثات حالة القوالب
> لحظياً، وستعتمد فقط على المزامنة اليومية (03:00) أو زر "مزامنة القوالب" اليدوي.

## 3) الأمان
كل طلب `POST` يمرّ عبر [VerifyWhatsAppSignature](../app/Http/Middleware/VerifyWhatsAppSignature.php)
الذي يتحقق من ترويسة `X-Hub-Signature-256` مقابل `WHATSAPP_APP_SECRET`.
تأكّد من ضبط `WHATSAPP_APP_SECRET` بقيمة App Secret الصحيحة، وإلا رُفضت كل الطلبات (403).

## 4) البث اللحظي لحالة القالب
عند وصول `message_template_status_update` يُبثّ حدث
[TemplateStatusUpdated](../app/Events/TemplateStatusUpdated.php) على قناة
`whatsapp.account.{id}` باسم `template.status`. للاستماع في React:

```jsx
echo.private(`whatsapp.account.${accountId}`)
  .listen('.template.status', (e) => {
    // e = { id, name, language, status }
    // أعد تحميل قائمة القوالب أو حدّث حالتها في الواجهة
  });
```
