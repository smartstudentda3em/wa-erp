<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * توجيه المحادثات الوارد:
 *  - جدول departments (الأنشطة: تكييف / قرطاسية / مطبعة ...).
 *  - حقول التوجيه على users (القسم + حالة التواجد + مؤشر round-robin).
 *  - ربط أرقام واتساب بالقسم (توجيه حسب المصدر).
 *
 * ملاحظة: نتجنّب قيود المفاتيح الأجنبية على SQLite (لا يدعم ALTER لإضافتها لجدول قائم)،
 * ونكتفي بأعمدة مفهرَسة مع فرض التكامل على مستوى التطبيق.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ===== الأنشطة / الأقسام =====
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // اسم النشاط
            $table->string('code')->nullable()->unique();  // كود/كلمة مفتاحية اختيارية للتوجيه (AC, PRINT ...)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ===== حقول التوجيه على المستخدمين =====
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('department_id')->nullable()->after('is_active');

            // حالة التواجد للتوزيع: available (متاح) / away (بالخارج مؤقتاً) / offline (غير متصل)
            $table->string('availability')->default('available')->after('department_id');

            // مؤشر الـ Round-Robin: آخر مرة وصلته محادثة عبر التوزيع التلقائي
            $table->timestamp('last_routed_at')->nullable()->after('availability');

            $table->index('department_id');
        });

        // ===== ربط رقم واتساب بالنشاط (توجيه حسب المصدر) =====
        Schema::table('whatsapp_accounts', function (Blueprint $table) {
            $table->unsignedBigInteger('department_id')->nullable();
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_accounts', function (Blueprint $table) {
            $table->dropColumn('department_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['department_id', 'availability', 'last_routed_at']);
        });

        Schema::dropIfExists('departments');
    }
};
