<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WhatsappAccountController;
use App\Http\Controllers\Webhooks\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| WhatsApp Webhook (بلا مصادقة — Meta لا تحمل جلسة)
|--------------------------------------------------------------------------
*/
Route::prefix('webhooks/whatsapp')->group(function () {
    Route::get('/', [WhatsAppWebhookController::class, 'verify']);
    Route::post('/', [WhatsAppWebhookController::class, 'handle'])
         ->middleware('whatsapp.signature');
});

// راوت مختصر مكافئ: /api/webhook (نفس منطق التحقق/الاستقبال)
Route::prefix('webhook')->group(function () {
    Route::get('/', [WhatsAppWebhookController::class, 'verify']);
    Route::post('/', [WhatsAppWebhookController::class, 'handle'])
         ->middleware('whatsapp.signature');
});

/*
|--------------------------------------------------------------------------
| المصادقة (Sanctum SPA)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get ('/me',     [AuthController::class, 'me']);

    // ===== المحادثات (Inbox) =====
    Route::get   ('/conversations',                        [ConversationController::class, 'index']);
    Route::get   ('/conversations/{conversation}',         [ConversationController::class, 'show']);
    Route::post  ('/conversations/{conversation}/read',    [ConversationController::class, 'markRead']);
    Route::post  ('/conversations/{conversation}/assign',  [ConversationController::class, 'assign']);
    Route::post  ('/conversations/{conversation}/close',   [ConversationController::class, 'close']);
    Route::post  ('/conversations/{conversation}/reopen',  [ConversationController::class, 'reopen']);

    // ===== الرسائل =====
    Route::post  ('/conversations/{conversation}/messages',          [MessageController::class, 'store']);
    Route::post  ('/conversations/{conversation}/messages/template', [MessageController::class, 'sendTemplate']);
    Route::post  ('/conversations/{conversation}/messages/media',    [MessageController::class, 'sendMedia']);
    Route::get   ('/messages/{message}/media',                       [MessageController::class, 'media']);

    // ===== CRM + المبيعات =====
    Route::get   ('/customers',            [CustomerController::class, 'index']);
    Route::get   ('/customers/{customer}', [CustomerController::class, 'show']);
    Route::post  ('/orders',               [OrderController::class, 'store']);
    Route::get   ('/templates',            [TemplateController::class, 'index']);
    Route::get   ('/whatsapp-accounts',    [WhatsappAccountController::class, 'index']);
    Route::get   ('/users',                [UserController::class, 'index']);

    // ===== إعدادات حسابات واتساب (admin فقط) =====
    Route::get   ('/settings/whatsapp-accounts',                    [WhatsappAccountController::class, 'settingsIndex']);
    Route::post  ('/settings/whatsapp-accounts',                    [WhatsappAccountController::class, 'store']);
    Route::put   ('/settings/whatsapp-accounts/{whatsapp_account}', [WhatsappAccountController::class, 'update']);
    Route::post  ('/settings/whatsapp-accounts/{whatsapp_account}/sync-templates', [WhatsappAccountController::class, 'syncTemplates']);

    // ===== الحملات (Broadcast) =====
    Route::post  ('/audience/preview',                 [CampaignController::class, 'previewFilter']);
    Route::post  ('/audience/sample',                  [CampaignController::class, 'sampleAudience']);
    Route::post  ('/campaigns/test-send',              [CampaignController::class, 'testSend']);
    Route::get   ('/campaigns/test-messages',          [CampaignController::class, 'testMessages']);
    Route::get   ('/test-log',                         [CampaignController::class, 'testLog']);
    Route::get   ('/test-log/export',                  [CampaignController::class, 'exportTestLog']);
    Route::get   ('/test-log/stats',                   [CampaignController::class, 'testStats']);
    Route::post  ('/test-log/{testMessage}/resend',    [CampaignController::class, 'resendTest']);
    Route::get   ('/campaigns',                        [CampaignController::class, 'index']);
    Route::post  ('/campaigns',                        [CampaignController::class, 'store']);
    Route::get   ('/campaigns/{campaign}',             [CampaignController::class, 'show']);
    Route::post  ('/campaigns/{campaign}/preview-audience', [CampaignController::class, 'previewAudience']);
    Route::post  ('/campaigns/{campaign}/launch',      [CampaignController::class, 'launch']);
    Route::post  ('/campaigns/{campaign}/cancel',      [CampaignController::class, 'cancel']);
    Route::get   ('/campaigns/{campaign}/recipients',  [CampaignController::class, 'recipients']);
});
