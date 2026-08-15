<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('whatsapp_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('label');                          // اسم داخلي: "المبيعات" / "الدعم"
            $table->string('display_phone_number');           // +9665...
            $table->string('phone_number_id')->unique();      // Phone Number ID من Meta
            $table->string('waba_id');                        // WhatsApp Business Account ID
            $table->text('access_token');                     // مشفّر عبر cast في الـ Model
            $table->string('webhook_verify_token')->nullable();
            $table->unsignedInteger('daily_limit')->nullable(); // حد Meta اليومي (Messaging Tier)
            $table->string('messaging_tier')->nullable();       // TIER_1K / TIER_10K ...
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_accounts');
    }
};
