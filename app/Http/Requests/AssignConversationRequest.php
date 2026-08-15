<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['assigned_to' => ['required', 'exists:users,id']];
    }
}
