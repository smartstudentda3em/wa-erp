<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

/**
 * الأنشطة/الأقسام الافتراضية. الـ code كلمة مفتاحية اختيارية للتوجيه بالرسالة.
 * آمن للتكرار (firstOrCreate) — لا يكرّر ولا يحذف بيانات قائمة.
 */
class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'التكييف',   'code' => 'ac'],
            ['name' => 'القرطاسية', 'code' => 'stationery'],
            ['name' => 'المطبعة',   'code' => 'print'],
        ];

        foreach ($departments as $d) {
            Department::firstOrCreate(['name' => $d['name']], [
                'code'      => $d['code'],
                'is_active' => true,
            ]);
        }
    }
}
