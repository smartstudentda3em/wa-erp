<?php

namespace App\Http\Controllers;

use App\Exports\TestMessagesExport;
use App\Http\Requests\StoreCampaignRequest;
use App\Http\Resources\CampaignResource;
use App\Jobs\DispatchBroadcastCampaign;
use App\Models\BroadcastCampaign;
use App\Models\MessageTemplate;
use App\Models\TestMessage;
use App\Models\User;
use App\Models\WhatsappAccount;
use App\Services\AudienceResolver;
use App\Services\WhatsApp\WhatsAppCloudService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class CampaignController extends Controller
{
    public function index()
    {
        return CampaignResource::collection(
            BroadcastCampaign::with('template:id,name')->latest()->paginate(20)
        );
    }

    public function store(StoreCampaignRequest $request)
    {
        $this->authorize('create', BroadcastCampaign::class);

        $campaign = BroadcastCampaign::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'status'     => $request->filled('scheduled_at') ? 'scheduled' : 'draft',
        ]);

        return new CampaignResource($campaign);
    }

    public function show(BroadcastCampaign $campaign)
    {
        return new CampaignResource($campaign->load('template:id,name', 'whatsappAccount:id,label'));
    }

    /** عدّ الجمهور قبل الإطلاق (لحملة محفوظة) */
    public function previewAudience(BroadcastCampaign $campaign, AudienceResolver $audience)
    {
        return response()->json(['audience_count' => $audience->count($campaign->audience_filter)]);
    }

    /** عدّ الجمهور من فلتر مباشر (قبل إنشاء الحملة — يُستخدم في نموذج React) */
    public function previewFilter(Request $request, AudienceResolver $audience)
    {
        $filter = $request->validate([
            'audience_filter'             => ['nullable', 'array'],
            'audience_filter.tags'        => ['nullable', 'array'],
            'audience_filter.source'      => ['nullable', 'string'],
            'audience_filter.assigned_to' => ['nullable', 'integer'],
        ])['audience_filter'] ?? [];

        return response()->json(['audience_count' => $audience->count($filter)]);
    }

    /** أول عميل مطابق للفلتر — لمعاينة واقعية للرسالة قبل الإطلاق */
    public function sampleAudience(Request $request, AudienceResolver $audience)
    {
        $filter = $request->validate([
            'audience_filter'        => ['nullable', 'array'],
            'audience_filter.tags'   => ['nullable', 'array'],
            'audience_filter.source' => ['nullable', 'string'],
        ])['audience_filter'] ?? [];

        $customer = $audience->resolve($filter)->first();

        return response()->json([
            'customer' => $customer ? [
                'name'         => $customer->name,
                'phone'        => $customer->phone,
                'company_name' => $customer->company_name,
                'email'        => $customer->email,
            ] : null,
        ]);
    }

    /** إرسال رسالة اختبار لرقم محدّد قبل إطلاق الحملة للجميع */
    public function testSend(Request $request)
    {
        $this->authorize('create', BroadcastCampaign::class);

        $data = $request->validate([
            'whatsapp_account_id' => ['required', 'exists:whatsapp_accounts,id'],
            'template_id'         => ['required', 'exists:message_templates,id'],
            'to'                  => ['required', 'string', 'max:20'],
            'variables'           => ['nullable', 'array'],
            'header_media'        => ['nullable', 'url'], // رابط وسائط لرأس القالب (صورة/فيديو/مستند)
        ]);

        $account  = WhatsappAccount::findOrFail($data['whatsapp_account_id']);
        $template = MessageTemplate::where('id', $data['template_id'])
            ->where('whatsapp_account_id', $account->id)
            ->where('status', 'approved')
            ->firstOrFail();

        $components = $this->buildTestComponents($template, $data['variables'] ?? [], $data['header_media'] ?? null);

        $waMessageId = null;
        $status = 'failed';
        $error = null;

        try {
            $service  = new WhatsAppCloudService($account);
            $response = $service->sendTemplate($data['to'], $template->name, $template->language, $components);

            $waMessageId = $response['messages'][0]['id'] ?? null;
            $status = 'sent';
        } catch (Throwable $e) {
            report($e);
            $error = $e->getMessage();
        }

        // سجّل محاولة الاختبار (نجاحاً أو فشلاً)
        TestMessage::create([
            'whatsapp_account_id' => $account->id,
            'message_template_id' => $template->id,
            'user_id'             => $request->user()->id,
            'to_phone'            => $data['to'],
            'variables'           => $data['variables'] ?? [],
            'header_media'        => $data['header_media'] ?? null,
            'status'              => $status,
            'wa_message_id'       => $waMessageId,
            'error_message'       => $error,
        ]);

        if ($status === 'failed') {
            return response()->json(['message' => 'فشل إرسال الاختبار: ' . $error], 502);
        }

        return response()->json([
            'message'       => 'تم إرسال رسالة الاختبار بنجاح.',
            'wa_message_id' => $waMessageId,
        ]);
    }

    /** سجلّ رسائل الاختبار الأخيرة (widget داخل نموذج الحملة) */
    public function testMessages()
    {
        $this->authorize('create', BroadcastCampaign::class);

        $logs = TestMessage::with(['user:id,name', 'template:id,name'])
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn ($t) => $this->presentTest($t));

        return response()->json(['data' => $logs]);
    }

    /** صفحة السجل المستقلة: فلترة (المُرسِل/الحالة/القالب) + ترقيم + خيارات الفلاتر */
    public function testLog(Request $request)
    {
        $this->authorize('create', BroadcastCampaign::class);

        $logs = TestMessage::with(['user:id,name', 'template:id,name'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->user_id, fn ($q, $id) => $q->where('user_id', $id))
            ->when($request->template_id, fn ($q, $id) => $q->where('message_template_id', $id))
            ->latest()
            ->paginate(25)
            ->through(fn ($t) => $this->presentTest($t));

        // خيارات الفلاتر: فقط من ظهروا فعلاً في السجل
        $users = User::whereIn('id', TestMessage::select('user_id')->distinct())->get(['id', 'name']);
        $templates = MessageTemplate::whereIn('id', TestMessage::select('message_template_id')->distinct())
            ->get(['id', 'name']);

        return response()->json([
            'logs'    => $logs,
            'filters' => ['users' => $users, 'templates' => $templates],
        ]);
    }

    /** إعادة إرسال رسالة اختبار بنفس الرقم والقالب والقيَم */
    public function resendTest(Request $request, TestMessage $testMessage)
    {
        $this->authorize('create', BroadcastCampaign::class);

        $account  = $testMessage->whatsappAccount;
        $template = MessageTemplate::where('id', $testMessage->message_template_id)
            ->where('status', 'approved')
            ->first();

        if (! $account || ! $template) {
            return response()->json(['message' => 'القالب أو الحساب لم يعد متاحاً.'], 422);
        }

        $components = $this->buildTestComponents($template, $testMessage->variables ?? [], $testMessage->header_media);

        $waMessageId = null;
        $status = 'failed';
        $error = null;

        try {
            $service  = new WhatsAppCloudService($account);
            $response = $service->sendTemplate($testMessage->to_phone, $template->name, $template->language, $components);
            $waMessageId = $response['messages'][0]['id'] ?? null;
            $status = 'sent';
        } catch (Throwable $e) {
            report($e);
            $error = $e->getMessage();
        }

        TestMessage::create([
            'whatsapp_account_id' => $account->id,
            'message_template_id' => $template->id,
            'user_id'             => $request->user()->id,
            'to_phone'            => $testMessage->to_phone,
            'variables'           => $testMessage->variables,
            'header_media'        => $testMessage->header_media,
            'status'              => $status,
            'wa_message_id'       => $waMessageId,
            'error_message'       => $error,
        ]);

        if ($status === 'failed') {
            return response()->json(['message' => 'فشلت إعادة الإرسال: ' . $error], 502);
        }

        return response()->json(['message' => 'تمت إعادة الإرسال بنجاح.']);
    }

    /** تصدير السجل إلى ملف Excel (.xlsx) مُنسّق يحترم الفلاتر */
    public function exportTestLog(Request $request)
    {
        $this->authorize('create', BroadcastCampaign::class);

        $filters  = $request->only('status', 'user_id', 'template_id');
        $filename = 'test-messages-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(new TestMessagesExport($filters), $filename);
    }

    /** إحصائيات الاختبار: إجمالي/نجاح/فشل عام + تفصيل لكل قالب */
    public function testStats()
    {
        $this->authorize('create', BroadcastCampaign::class);

        $total  = TestMessage::count();
        $sent   = TestMessage::where('status', 'sent')->count();
        $failed = $total - $sent;

        $byTemplate = TestMessage::selectRaw("message_template_id, COUNT(*) as total, SUM(status = 'sent') as sent")
            ->groupBy('message_template_id')
            ->with('template:id,name')
            ->get()
            ->map(function ($r) {
                $t = (int) $r->total;
                $s = (int) $r->sent;
                return [
                    'template'     => $r->template?->name ?? '—',
                    'total'        => $t,
                    'sent'         => $s,
                    'failed'       => $t - $s,
                    'success_rate' => $t ? round($s / $t * 100) : 0,
                ];
            })
            ->sortByDesc('total')
            ->values();

        return response()->json([
            'overall' => [
                'total'        => $total,
                'sent'         => $sent,
                'failed'       => $failed,
                'success_rate' => $total ? round($sent / $total * 100) : 0,
            ],
            'by_template' => $byTemplate,
        ]);
    }

    protected function presentTest(TestMessage $t): array
    {
        return [
            'id'         => $t->id,
            'to'         => $t->to_phone,
            'status'     => $t->status,
            'template'   => $t->template?->name,
            'user'       => $t->user?->name,
            'error'      => $t->error_message,
            'created_at' => $t->created_at->toIso8601String(),
        ];
    }

    /**
     * يبني components القالب للاختبار: رأس وسائط (إن وُجد) + جسم بمتغيّرات.
     * المتغيّرات الفارغة تُملأ بكلمة "اختبار" لتفادي رفض Meta.
     */
    protected function buildTestComponents(MessageTemplate $template, array $vars, ?string $headerMedia = null): array
    {
        $components = [];
        $comps = collect($template->components ?? []);

        // ===== رأس وسائط (IMAGE/VIDEO/DOCUMENT) =====
        $header = $comps->first(fn ($c) => strtoupper($c['type'] ?? '') === 'HEADER');
        if ($header) {
            $format = strtoupper($header['format'] ?? 'TEXT');
            if (in_array($format, ['IMAGE', 'VIDEO', 'DOCUMENT'], true)) {
                // الرابط المُدخل، وإلا نموذج Meta (header_handle) إن توفّر
                $link = $headerMedia ?: ($header['example']['header_handle'][0] ?? null);
                if ($link) {
                    $type = strtolower($format); // image | video | document
                    $media = array_filter([
                        'link'     => $link,
                        'filename' => $type === 'document' ? 'document.pdf' : null,
                    ]);
                    $components[] = ['type' => 'header', 'parameters' => [['type' => $type, $type => $media]]];
                }
            }
        }

        // ===== جسم بمتغيّرات =====
        $body = $comps->first(fn ($c) => strtoupper($c['type'] ?? '') === 'BODY');
        preg_match_all('/\{\{(\d+)\}\}/', $body['text'] ?? '', $m);
        $max = ! empty($m[1]) ? max(array_map('intval', $m[1])) : 0;

        if ($max > 0) {
            $parameters = [];
            for ($i = 1; $i <= $max; $i++) {
                $val = $vars[$i] ?? $vars[(string) $i] ?? '';
                $parameters[] = ['type' => 'text', 'text' => $val !== '' ? (string) $val : 'اختبار'];
            }
            $components[] = ['type' => 'body', 'parameters' => $parameters];
        }

        return $components;
    }

    /** إطلاق فوري */
    public function launch(BroadcastCampaign $campaign)
    {
        $this->authorize('launch', $campaign);

        abort_if(! in_array($campaign->status, ['draft', 'scheduled']), 422, 'الحملة أُطلقت مسبقاً');
        abort_unless($campaign->template && $campaign->template->status === 'approved', 422, 'القالب غير معتمد');

        $campaign->update(['status' => 'queued']);
        DispatchBroadcastCampaign::dispatch($campaign);

        return response()->json(['message' => 'تم جدولة الحملة للإرسال']);
    }

    /** إيقاف حملة جارية (إلغاء الـ batch) */
    public function cancel(BroadcastCampaign $campaign)
    {
        $this->authorize('cancel', $campaign);

        if ($campaign->batch_id && $batch = Bus::findBatch($campaign->batch_id)) {
            $batch->cancel();
        }
        $campaign->update(['status' => 'paused']);

        return response()->json(['message' => 'تم إيقاف الحملة']);
    }

    public function recipients(BroadcastCampaign $campaign, Request $request)
    {
        $recipients = $campaign->recipients()
            ->with('customer:id,name,phone')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(50);

        return response()->json($recipients);
    }
}
