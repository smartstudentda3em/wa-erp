<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('wa_message_id')->nullable()->unique(); // Idempotency + status mapping
            $table->enum('direction', ['inbound', 'outbound']);
            $table->enum('sender_type', ['customer', 'agent', 'system']);
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['text', 'image', 'document', 'audio', 'video', 'template', 'location', 'sticker'])
                  ->default('text');
            $table->text('body')->nullable();
            $table->string('media_id')->nullable();   // معرّف Meta الدائم
            $table->string('media_url')->nullable();   // رابط مؤقت (يُجلب عند الطلب)
            $table->string('media_mime')->nullable();
            $table->foreignId('template_id')->nullable()->constrained('message_templates')->nullOnDelete();
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed', 'received'])->default('pending');
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamp('wa_timestamp')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
