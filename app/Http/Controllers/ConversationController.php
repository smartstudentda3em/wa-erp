<?php

namespace App\Http\Controllers;

use App\Events\ConversationAssigned;
use App\Http\Requests\AssignConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    /** قائمة المحادثات (Inbox) مع فلاتر + تقييد حسب الدور */
    public function index(Request $request)
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->with(['customer:id,name,phone', 'assignedTo:id,name'])
            // Agent (بلا صلاحية view_all): المسندة إليه أو غير المسندة فقط
            ->unless($user->can('conversations.view_all'), function ($q) use ($user) {
                $q->where(fn ($w) => $w->where('assigned_to', $user->id)->orWhereNull('assigned_to'));
            })
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->boolean('mine'), fn ($q) => $q->where('assigned_to', $user->id))
            ->when($request->search, function ($q, $s) {
                $q->whereHas('customer', fn ($c) =>
                    $c->where('name', 'like', "%$s%")->orWhere('phone', 'like', "%$s%"));
            })
            ->orderByDesc('last_message_at')
            ->paginate(20);

        return ConversationResource::collection($conversations);
    }

    /** فتح محادثة + رسائلها */
    public function show(Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $conversation->load(['customer', 'assignedTo:id,name', 'whatsappAccount:id,label']);

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->paginate(50);

        return response()->json([
            'conversation' => new ConversationResource($conversation),
            'messages'     => MessageResource::collection($messages),
        ]);
    }

    public function markRead(Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $conversation->update(['unread_count' => 0]);
        return response()->noContent();
    }

    /** تعيين/تحويل لموظف + تسجيل في سجل التحويلات */
    public function assign(AssignConversationRequest $request, Conversation $conversation)
    {
        $this->authorize('assign', $conversation);

        $newAgentId = $request->validated('assigned_to');

        $conversation->assignments()->whereNull('unassigned_at')->update(['unassigned_at' => now()]);
        $conversation->assignments()->create([
            'assigned_to' => $newAgentId,
            'assigned_by' => $request->user()->id,
        ]);
        $conversation->update(['assigned_to' => $newAgentId]);

        broadcast(new ConversationAssigned($conversation))->toOthers();

        return new ConversationResource($conversation->fresh(['assignedTo', 'customer']));
    }

    public function close(Conversation $conversation)
    {
        $this->authorize('close', $conversation);

        $conversation->update(['status' => 'closed', 'closed_at' => now()]);
        return new ConversationResource($conversation);
    }

    public function reopen(Conversation $conversation)
    {
        $this->authorize('close', $conversation);

        $conversation->update(['status' => 'open', 'closed_at' => null]);
        return new ConversationResource($conversation);
    }
}
