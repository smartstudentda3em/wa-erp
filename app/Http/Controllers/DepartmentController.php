<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * إدارة الأنشطة/الأقسام (تكييف/قرطاسية/مطبعة ...).
 * القائمة متاحة لمن يملك صلاحية التحويل؛ الإنشاء/التعديل لمن يملك accounts.manage (admin).
 */
class DepartmentController extends Controller
{
    /** قائمة الأقسام + عدد الموظفين بكل قسم */
    public function index(Request $request)
    {
        abort_unless($request->user()->can('conversations.assign'), 403);

        $departments = Department::withCount('users')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'is_active']);

        return response()->json(['data' => $departments]);
    }

    public function store(Request $request)
    {
        $this->authorize('accounts.manage');

        $data = $this->validateData($request);
        $department = Department::create($data);

        return response()->json(['data' => $this->present($department)], 201);
    }

    public function update(Request $request, Department $department)
    {
        $this->authorize('accounts.manage');

        $data = $this->validateData($request, $department->id);
        $department->update($data);

        return response()->json(['data' => $this->present($department->fresh())]);
    }

    public function destroy(Department $department)
    {
        $this->authorize('accounts.manage');

        // فكّ ارتباط الموظفين والأرقام قبل الحذف (department_id بلا قيد أجنبي)
        \App\Models\User::where('department_id', $department->id)->update(['department_id' => null]);
        \App\Models\WhatsappAccount::where('department_id', $department->id)->update(['department_id' => null]);

        $department->delete();

        return response()->noContent();
    }

    protected function validateData(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'code'      => ['nullable', 'string', 'max:64', Rule::unique('departments', 'code')->ignore($ignoreId)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // كود فارغ → null (حتى لا يتعارض فراغان في قيد الفرادة)
        $data['code'] = ($data['code'] ?? null) ?: null;

        return $data;
    }

    protected function present(Department $d): array
    {
        return [
            'id'          => $d->id,
            'name'        => $d->name,
            'code'        => $d->code,
            'is_active'   => (bool) $d->is_active,
            'users_count' => $d->users()->count(),
        ];
    }
}
