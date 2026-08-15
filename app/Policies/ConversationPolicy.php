<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

/**
 * سياسة الوصول للمحادثات (تُكتشف تلقائياً في Laravel 11 بحكم التسمية).
 * الاعتماد على صلاحيات Spatie + ملكية المحادثة للموظف (Agent).
 */
class ConversationPolicy
{
    /** المستخدم غير النشط لا يصل لشيء */
    public function before(User $user, string $ability): ?bool
    {
        if (! $user->is_active) {
            return false;
        }
        return null; // تابع بقية الفحوص
    }

    public function viewAny(User $user): bool
    {
        return true; // القائمة تُفلتر داخل الـ Controller حسب الدور
    }

    /** رؤية محادثة بعينها */
    public function view(User $user, Conversation $conversation): bool
    {
        if ($user->can('conversations.view_all')) {
            return true; // admin / manager
        }
        // Agent: المسندة إليه أو غير المسندة فقط
        return $conversation->assigned_to === $user->id
            || is_null($conversation->assigned_to);
    }

    /** تحويل/تعيين لموظف آخر — للمديرين فقط */
    public function assign(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.assign');
    }

    /** إغلاق/إعادة فتح */
    public function close(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.close')
            || $conversation->assigned_to === $user->id;
    }

    /** إرسال رسالة داخل المحادثة */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }
}
