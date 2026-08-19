<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /** قائمة الموظفين النشطين (لاستخدامها في التحويل) — لمن يملك صلاحية التحويل */
    public function index(Request $request)
    {
        abort_unless($request->user()->can('conversations.assign'), 403);

        $users = User::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $users]);
    }
}
