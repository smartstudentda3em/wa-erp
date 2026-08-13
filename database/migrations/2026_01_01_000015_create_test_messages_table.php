<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('test_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_template_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('to_phone');
            $table->json('variables')->nullable();       // قيَم المتغيّرات المُرسَلة (لإعادة إرسال مطابقة)
            $table->string('header_media')->nullable();   // رابط وسائط الرأس إن وُجد
            $table->enum('status', ['sent', 'failed'])->default('sent');
            $table->string('wa_message_id')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_messages');
    }
};
