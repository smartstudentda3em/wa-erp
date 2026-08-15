<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessWhatsAppWebhook;
use Illuminate\Http\Request;

class WhatsAppWebhookController extends Controller
{
    /** GET: تحقق Meta لمرة واحدة عند ربط الـ Webhook */
    public function verify(Request $request)
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === config('services.whatsapp.verify_token')) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    /** POST: استقبل، ادفع للطابور، وردّ 200 فوراً */
    public function handle(Request $request)
    {
        ProcessWhatsAppWebhook::dispatch($request->all());

        return response()->json(['status' => 'received'], 200);
    }
}
