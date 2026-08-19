<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Department;
use App\Models\User;
use App\Models\WhatsappAccount;
use Illuminate\Support\Facades\DB;

/**
 * موجّه المحادثات الوارد (Inbound Routing).
 *
 * القواعد بالترتيب:
 *  1) استثناء "السيلز المسؤول": لو العميل مربوط بموظف (Account Manager) → توجيه مباشر له،
 *     بتجاوز الـ round-robin (يضمن أن العميل المعروف يعود دائماً لنفس الموظف).
 *  2) توجيه حسب النشاط: تحديد القسم من (كود بالرسالة → رقم واتساب المستقبِل) ثم التوزيع داخل القسم فقط.
 *  3) Round-Robin عادل: يُختار الموظف المتاح الأقل حداثةً في تلقّي محادثة، مع تخطّي غير المتاحين (away/offline).
 *  4) لو لا يوجد موظف متاح → تبقى المحادثة بلا تعيين في صندوق الإدارة (Master Inbox) للمعالجة اليدوية.
 */
class ConversationRouter
{
    /**
     * يوجّه محادثة واردة ويعيد الموظف المُسنَد إليها (أو null إن تعذّر).
     *
     * @param  string|null  $firstMessageText  نص أول رسالة (لتوجيه القسم بالكود عند وجوده)
     */
    public function route(Conversation $conversation, ?string $firstMessageText = null): ?User
    {
        return DB::transaction(function () use ($conversation, $firstMessageText) {
            $customer = $conversation->customer;

            // 1) استثناء السيلز المسؤول (توزيع "لاصق" للعملاء المعروفين)
            if ($manager = $this->accountManagerFor($customer)) {
                return $this->assign($conversation, $manager, 'account_manager');
            }

            // 2) تحديد النشاط/القسم
            $department = $this->resolveDepartment($conversation, $firstMessageText);

            // 3) Round-Robin داخل القسم بين المتاحين
            $agent = $this->pickAgent($department);

            // 3.b) عند التفعيل: أي موظف متاح خارج القسم كحل أخير
            if (! $agent && config('routing.cross_department_fallback')) {
                $agent = $this->pickAgent(null);
            }

            if (! $agent) {
                return null; // بلا تعيين → Master Inbox
            }

            // 4) أول تواصل: اجعل هذا الموظف هو السيلز المسؤول مستقبلاً (sticky)
            if (is_null($customer->assigned_to)) {
                $customer->forceFill(['assigned_to' => $agent->id])->save();
            }

            return $this->assign($conversation, $agent, 'round_robin');
        });
    }

    /** السيلز المسؤول عن العميل (إن وُجد وكان حسابه مفعّلاً) */
    protected function accountManagerFor(Customer $customer): ?User
    {
        if (! $customer->assigned_to) {
            return null;
        }

        $manager = User::find($customer->assigned_to);

        // نوجّه له حتى لو كان away/offline (العميل مِلكه ويراه عند عودته)،
        // لكن نتخطّاه إن كان حسابه مُعطَّلاً (is_active = false).
        return ($manager && $manager->is_active) ? $manager : null;
    }

    /** تحديد القسم: كود بالرسالة ← رقم واتساب المستقبِل ← null (بلا قسم) */
    protected function resolveDepartment(Conversation $conversation, ?string $text): ?Department
    {
        // (أ) كلمة/كود في أول رسالة يطابق كود قسم مفعّل
        if ($text !== null && trim($text) !== '') {
            $lower = mb_strtolower($text);
            foreach (Department::where('is_active', true)->whereNotNull('code')->get() as $dep) {
                if (str_contains($lower, mb_strtolower($dep->code))) {
                    return $dep;
                }
            }
        }

        // (ب) القسم المرتبط برقم واتساب المستقبِل (المصدر)
        $account = $conversation->whatsappAccount
            ?? WhatsappAccount::find($conversation->whatsapp_account_id);

        if ($account && $account->department_id) {
            return Department::find($account->department_id);
        }

        return null;
    }

    /** اختيار الموظف التالي (Round-Robin عادل بين المتاحين فقط) */
    protected function pickAgent(?Department $department): ?User
    {
        $role    = config('routing.sales_role', 'agent');
        $timeout = config('routing.presence_timeout'); // دقائق أو null

        return User::query()
            ->where('is_active', true)
            ->where('availability', 'available')   // تخطّي away / offline
            ->when($department, fn ($q) => $q->where('department_id', $department->id))
            ->when($timeout, fn ($q) => $q->where('last_seen_at', '>=', now()->subMinutes((int) $timeout)))
            ->whereHas('roles', fn ($q) => $q->where('name', $role))
            ->orderByRaw('last_routed_at IS NULL DESC') // من لم يتلقَّ شيئاً بعد أولاً
            ->orderBy('last_routed_at')                 // ثم الأقل حداثةً (جوهر الـ round-robin)
            ->first();
    }

    /** إسناد + تسجيل في سجل التحويلات + تقديم مؤشر الـ round-robin */
    protected function assign(Conversation $conversation, User $agent, string $reason): User
    {
        // أغلق أي إسناد سابق مفتوح ثم افتح إسناداً جديداً (assigned_by = null → توزيع تلقائي)
        $conversation->assignments()->whereNull('unassigned_at')->update(['unassigned_at' => now()]);
        $conversation->assignments()->create([
            'assigned_to' => $agent->id,
            'assigned_by' => null,
        ]);

        $conversation->forceFill(['assigned_to' => $agent->id])->save();

        // قدّم المؤشر في التوزيع التلقائي فقط (لا في التوجيه المباشر للسيلز المسؤول)
        if ($reason === 'round_robin') {
            $agent->forceFill(['last_routed_at' => now()])->save();
        }

        return $agent;
    }
}
