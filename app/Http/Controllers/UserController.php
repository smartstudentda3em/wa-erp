<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * قائمة الموظفين — تُستخدم في التحويل وفي إدارة الفريق.
     * افتراضيًا: النشطون فقط. مع include_inactive=1 (للإدارة): الكل.
     */
    public function index(Request $request)
    {
        abort_unless($request->user()->can('conversations.assign'), 403);

        $users = User::with(['department:id,name', 'roles:id,name'])
            ->when($request->filled('department_id'),
                fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->unless($request->boolean('include_inactive'),
                fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => $this->present($u));

        return response()->json(['data' => $users]);
    }

    /** إنشاء موظف مبيعات (admin) */
    public function store(Request $request)
    {
        $this->authorize('accounts.manage');

        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'phone'         => ['required', 'string', 'max:32', 'unique:users,phone'],
            'password'      => ['required', 'string', 'min:6'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'role'          => ['nullable', 'string', 'in:admin,manager,agent'],
            'availability'  => ['nullable', 'in:available,away,offline'],
            'is_active'     => ['sometimes', 'boolean'],
        ]);

        $user = User::create([
            'name'          => $data['name'],
            'phone'         => $data['phone'],
            'password'      => $data['password'], // cast hashed
            'department_id' => $data['department_id'] ?? null,
            'availability'  => $data['availability'] ?? 'available',
            'is_active'     => $data['is_active'] ?? true,
        ]);
        $user->syncRoles([$data['role'] ?? 'agent']);

        return response()->json(['data' => $this->present($user->fresh(['department', 'roles']))], 201);
    }

    /** تعديل موظف (admin). كلمة السر اختيارية: فارغة = إبقاء الحالية */
    public function update(Request $request, User $user)
    {
        $this->authorize('accounts.manage');

        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'phone'         => ['sometimes', 'string', 'max:32', Rule::unique('users', 'phone')->ignore($user->id)],
            'password'      => ['nullable', 'string', 'min:6'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'role'          => ['nullable', 'string', 'in:admin,manager,agent'],
            'availability'  => ['nullable', 'in:available,away,offline'],
            'is_active'     => ['sometimes', 'boolean'],
        ]);

        foreach (['name', 'phone', 'department_id', 'availability', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = $data[$field];
            }
        }
        if (! empty($data['password'])) {
            $user->password = $data['password']; // cast hashed
        }
        $user->save();

        if (! empty($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        return response()->json(['data' => $this->present($user->fresh(['department', 'roles']))]);
    }

    /** تحديث حالة تواجد الموظف نفسه (متاح/بالخارج/غير متصل) — يؤثر على التوزيع */
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

    protected function present(User $u): array
    {
        return [
            'id'            => $u->id,
            'name'          => $u->name,
            'phone'         => $u->phone,
            'department_id' => $u->department_id,
            'department'    => $u->department?->only(['id', 'name']),
            'availability'  => $u->availability,
            'is_active'     => (bool) $u->is_active,
            'role'          => $u->getRoleNames()->first(),
        ];
    }
}
