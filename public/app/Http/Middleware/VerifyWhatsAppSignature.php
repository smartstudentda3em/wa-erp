<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * يتحقق من توقيع Meta (X-Hub-Signature-256 = HMAC-SHA256 لجسم الطلب بـ App Secret).
 * يمنع الطلبات المزوّرة قبل أي معالجة.
 */
class VerifyWhatsAppSignature
{
    public function handle(Request $request, Closure $next)
    {
        $signature = $request->header('X-Hub-Signature-256');
        $payload   = $request->getContent();
        $secret    = config('services.whatsapp.app_secret');

        $expected = 'sha256=' . hash_hmac('sha256', $payload, (string) $secret);

        if (! $signature || ! hash_equals($expected, $signature)) {
            Log::warning('WhatsApp webhook: invalid signature', ['ip' => $request->ip()]);
            abort(403, 'Invalid signature');
        }

        return $next($request);
    }
}
