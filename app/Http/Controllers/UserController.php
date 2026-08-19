<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /** قائمة الموظفين النشطين (لاستخدامها في التحويل) — لمن يملك صلاحية التحويل */
    public function index(Request $request)
    {
        abort_unless($request->user()->can('conversations.assign'), 403);

        $users = User::with('department:id,name')
            ->where('is_active', true)
            ->when($request->filled('department_id'),
                fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->orderBy('name')
            ->get(['id', 'name', 'department_id', 'availability', 'last_seen_at']);

        return response()->json(['data' => $users]);
    }

    /** تحديث حالة تواجد الموظف نفسه (متاح/بالخارج/غير متصل) — يؤثر على الـ round-robin */
    public function setAvailability(Request $request)
    {
        $data = $request->validate([
            'availability' => 'required|in:available,away,offline',
        ]);

        $user = $request->user();
        $user->forceFill([
            'availability' => $data['availability'],
            'last_seen_at' => now(),
        ])->save();

        return response()->json([
            'availability' => $user->availability,
            'last_seen_at' => $user->last_seen_at,
        ]);
    }
}
