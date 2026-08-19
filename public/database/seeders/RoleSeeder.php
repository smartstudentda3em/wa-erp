<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // ===== الصلاحيات =====
        $all = [
            'conversations.view_all',   // رؤية كل المحادثات (لا المسندة فقط)
            'conversations.assign',     // تحويل/تعيين لموظف آخر
            'conversations.close',      // إغلاق أي محادثة
            'campaigns.manage',         // إنشاء/إطلاق الحملات
            'customers.manage',
            'accounts.manage',          // إدارة حسابات واتساب (admin فقط)
        ];
        foreach ($all as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        // ===== الأدوار وربط الصلاحيات =====
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions($all); // كل الصلاحيات

        // المدير: كل الصلاحيات التشغيلية عدا إدارة الحسابات
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $manager->syncPermissions(array_diff($all, ['accounts.manage']));

        $agent = Role::firstOrCreate(['name' => 'agent', 'guard_name' => 'web']);
        $agent->syncPermissions([]); // موظف: يرى المسندة إليه فقط، بلا تحويل

        // ملاحظة: إنشاء المستخدم الإداري صار في UserSeeder (يُستدعى بعد هذا الـ Seeder).
    }
}
