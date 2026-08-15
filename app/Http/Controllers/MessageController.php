<?php

namespace App\Http\Controllers;

use App\Events\MessageReceived;
use App\Http\Requests\SendMediaRequest;
use App\Http\Requests\SendMessageRequest;
use App\Http\Requests\SendTemplateRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageTemplate;
use App\Services\WhatsApp\WhatsAppCloudService;
use Illuminate\Support\Str;
use Throwable;

class MessageController extends Controller
{
    /** إرسال رسالة نصية (مع فرض نافذة 24 ساعة) */
    public function store(SendMessageRequest $request, Conversation $conversation)
    {
        $this->authorize('sendMessage', $conversation);

        if (! $conversation->isWindowOpen()) {
            return response()->json([
                'message' => 'انتهت نافذة الـ 24 ساعة. استخدم قالباً معتمداً للتواصل.',
                'code'    => 'window_expired',
            ], 422);
        }

        $message = $conversation->messages()->create([
            'direction'      => 'outbound',
            'sender_type'    => 'agent',
            'sender_user_id' => $request->user()->id,
            'type'           => 'text',
            'body'           => $request->validated('body'),
            'status'         => 'pending',
        ]);

        try {
            $service  = new WhatsAppCloudService($conversation->whatsappAccount);
            $response = $service->sendText($conversation->customer->phone, $request->validated('body'));

            $message->update([
                'wa_message_id' => $response['messages'][0]['id'] ?? null,
                'status'        => 'sent',
            ]);
        } catch (Throwable $e) {
            $message->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            report($e);
            return response()->json(['message' => 'فشل الإرسال', 'data' => new MessageResource($message)], 502);
        }

        $conversation->update([
            'last_message_at'      => now(),
            'last_message_preview' => Str::limit($message->body, 60),
        ]);
        broadcast(new MessageReceived($message->load('conversation')))->toOthers();

        return new MessageResource($message);
    }

    /** إرسال قالب معتمد (يعمل خارج النافذة) */
    public function sendTemplate(SendTemplateRequest $request, Conversation $conversation)
    {
        $this->authorize('sendMessage', $conversation);

        $template = MessageTemplate::where('whatsapp_account_id', $conversation->whatsapp_account_id)
            ->where('id', $request->validated('template_id'))
            ->where('status', 'approved')
            ->firstOrFail();

        $message = $conversation->messages()->create([
            'direction'      => 'outbound',
            'sender_type'    => 'agent',
            'sender_user_id' => $request->user()->id,
            'type'           => 'template',
            'template_id'    => $template->id,
            'body'           => $template->name,
            'status'         => 'pending',
        ]);

        try {
            $service  = new WhatsAppCloudService($conversation->whatsappAccount);
            $response = $service->sendTemplate(
                $conversation->customer->phone,
                $template->name,
                $template->language,
                $request->validated('components', [])
            );

            $message->update([
                'wa_message_id' => $response['messages'][0]['id'] ?? null,
                'status'        => 'sent',
            ]);
        } catch (Throwable $e) {
            $message->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            report($e);
            return response()->json(['message' => 'فشل إرسال القالب'], 502);
        }

        $conversation->update([
            'last_message_at'      => now(),
            'last_message_preview' => "[قالب] {$template->name}",
        ]);
        broadcast(new MessageReceived($message->load('conversation')))->toOthers();

        return new MessageResource($message);
    }

    /** إرسال وسائط (صورة/ملف/فيديو) — رفع لـ Meta ثم إرسال */
    public function sendMedia(SendMediaRequest $request, Conversation $conversation)
    {
        $this->authorize('sendMessage', $conversation);

        if (! $conversation->isWindowOpen()) {
            return response()->json(['message' => 'انتهت نافذة الـ 24 ساعة', 'code' => 'window_expired'], 422);
        }

        $file = $request->file('file');
        $mime = $file->getMimeType();
        $type = str_contains($mime, 'image') ? 'image'
              : (str_contains($mime, 'video') ? 'video'
              : (str_contains($mime, 'audio') ? 'audio' : 'document'));

        $message = $conversation->messages()->create([
            'direction'      => 'outbound',
            'sender_type'    => 'agent',
            'sender_user_id' => $request->user()->id,
            'type'           => $type,
            'body'           => $request->input('caption'),
            'media_mime'     => $mime,
            'status'         => 'pending',
        ]);

        try {
            $service = new WhatsAppCloudService($conversation->whatsappAccount);
            $mediaId = $service->uploadMedia($file->getRealPath(), $mime);
            $response = $service->sendMedia($conversation->customer->phone, $type, $mediaId, $request->input('caption'));

            $message->update([
                'media_id'      => $mediaId,
                'wa_message_id' => $response['messages'][0]['id'] ?? null,
                'status'        => 'sent',
            ]);
        } catch (Throwable $e) {
            $message->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            report($e);
            return response()->json(['message' => 'فشل إرسال الملف'], 502);
        }

        $conversation->update([
            'last_message_at'      => now(),
            'last_message_preview' => "[$type]",
        ]);
        broadcast(new MessageReceived($message->load('conversation')))->toOthers();

        return new MessageResource($message);
    }

    /** جلب رابط وسائط طازج عند الطلب (روابط Meta تنتهي) */
    public function media(Message $message)
    {
        abort_unless($message->media_id, 404);

        $service  = new WhatsAppCloudService($message->conversation->whatsappAccount);
        $freshUrl = $service->fetchMediaUrl($message->media_id);

        return response()->json(['url' => $freshUrl]);
    }
}
