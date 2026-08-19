<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * المستخدم الأساسي — تسجيل الدخول برقم الهاتف (username) فقط.
     *
     * رقم الهاتف : 99970766
     * كلمة المرور: Ayman987654  (مشفّرة عبر Hash::make + cast 'hashed')
     * الاسم      : Ayman
     *
     * ملاحظة: عمود email محذوف من جدول users، والنظام يعتمد على الهاتف فقط،
     * لذلك لا يُضبَط البريد الإلكتروني هنا.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['phone' => '99970766'],          // مفتاح فريد يمنع تكرار الحساب عند إعادة التشغيل
            [
                'name'      => 'Ayman',
                'password'  => Hash::make('Ayman987654'),
                'is_active' => true,
            ]
        );

        // ضمان دور المدير
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        if (! $user->hasRole('admin')) {
            $user->assignRole($role);
        }
    }
}
