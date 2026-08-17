<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessWhatsAppWebhook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    /**
     * GET — تحقّق Meta لمرة واحدة عند ربط الـ Webhook.
     *
     * Meta ترسل: hub.mode / hub.verify_token / hub.challenge
     * (PHP يحوّل النقطة إلى شرطة سفلية، فنقرأها hub_mode / hub_verify_token / hub_challenge).
     * عند تطابق الوضع والتوكن نُعيد نص hub.challenge كما هو بحالة 200.
     */
    public function verify(Request $request)
    {
        // التوكن من الإعدادات، وإن كان فارغاً/غير مضبوط نستخدم 0145 (صامد حتى لو كان .env فارغاً أو مخزّناً مؤقتاً).
        $verifyToken = config('services.whatsapp.verify_token') ?: '0145';

        if ($request->query('hub_mode') === 'subscribe'
            && $request->query('hub_verify_token') === $verifyToken) {
            return response($request->query('hub_challenge'), 200)
                ->header('Content-Type', 'text/plain');
        }

        return response('Forbidden', 403);
    }

    /**
     * POST — استقبال أحداث/رسائل واتساب.
     * نردّ 200 فوراً (Meta تعيد المحاولة إن تأخّر الرد)، والمعالجة الفعلية في الخلفية.
     */
    public function handle(Request $request)
    {
        Log::info('WhatsApp webhook received', ['payload' => $request->all()]);

        ProcessWhatsAppWebhook::dispatch($request->all());

        return response()->json(['status' => 'received'], 200);
    }
}
