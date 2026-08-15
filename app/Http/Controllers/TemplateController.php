<?php

namespace App\Http\Controllers;

use App\Models\MessageTemplate;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    /** القوالب المعتمدة لحساب معيّن (للاستخدام في الشات والحملات) */
    public function index(Request $request)
    {
        $templates = MessageTemplate::query()
            ->when($request->whatsapp_account_id, fn ($q, $id) => $q->where('whatsapp_account_id', $id))
            ->when($request->boolean('approved_only', true), fn ($q) => $q->where('status', 'approved'))
            ->get(['id', 'whatsapp_account_id', 'name', 'language', 'category', 'status', 'components']);

        return response()->json(['data' => $templates]);
    }
}
