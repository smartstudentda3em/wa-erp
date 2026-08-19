<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWhatsappAccountRequest;
use App\Http\Requests\UpdateWhatsappAccountRequest;
use App\Jobs\SyncTemplatesJob;
use App\Models\WhatsappAccount;

class WhatsappAccountController extends Controller
{
    /** قائمة مختصرة للحسابات النشطة (لاختيار الحساب في الحملات/الواجهة) */
    public function index()
    {
        $accounts = WhatsappAccount::where('is_active', true)
            ->get(['id', 'label', 'display_phone_number']);

        return response()->json(['data' => $accounts]);
    }

    /** قائمة كاملة لصفحة الإعدادات (بلا التوكن — محمي بـ $hidden في الموديل) */
    public function settingsIndex()
    {
        $this->authorize('accounts.manage');

        $accounts = WhatsappAccount::get([
            'id', 'label', 'display_phone_number', 'phone_number_id',
            'waba_id', 'daily_limit', 'messaging_tier', 'is_active', 'department_id',
        ]);

        return response()->json(['data' => $accounts]);
    }

    public function store(StoreWhatsappAccountRequest $request)
    {
        $this->authorize('accounts.manage');

        $account = WhatsappAccount::create($request->validated());

        return response()->json(['data' => $this->present($account)], 201);
    }

    public function update(UpdateWhatsappAccountRequest $request, WhatsappAccount $whatsapp_account)
    {
        $this->authorize('accounts.manage');

        $data = $request->validated();

        // لا تُحدّث التوكن إذا تُرك فارغاً (حفاظاً على القيمة الحالية)
        if (empty($data['access_token'])) {
            unset($data['access_token']);
        }

        $whatsapp_account->update($data);

        return response()->json(['data' => $this->present($whatsapp_account->fresh())]);
    }

    /** إطلاق مزامنة القوالب من Meta لهذا الحساب */
    public function syncTemplates(WhatsappAccount $whatsapp_account)
    {
        $this->authorize('accounts.manage');

        SyncTemplatesJob::dispatch($whatsapp_account);

        return response()->json(['message' => 'بدأت مزامنة القوالب في الخلفية.']);
    }

    /** تمثيل آمن (بلا التوكن) */
    protected function present(WhatsappAccount $a): array
    {
        return [
            'id'                   => $a->id,
            'label'                => $a->label,
            'display_phone_number' => $a->display_phone_number,
            'phone_number_id'      => $a->phone_number_id,
            'waba_id'              => $a->waba_id,
            'daily_limit'          => $a->daily_limit,
            'messaging_tier'       => $a->messaging_tier,
            'is_active'            => $a->is_active,
            'department_id'        => $a->department_id,
        ];
    }
}
