<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWhatsappAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // الصلاحية تُفحص في الـ Controller عبر Policy/permission
    }

    public function rules(): array
    {
        return [
            'label'                => ['required', 'string', 'max:255'],
            'display_phone_number' => ['required', 'string', 'max:32'],
            'phone_number_id'      => ['required', 'string', 'unique:whatsapp_accounts,phone_number_id'],
            'waba_id'              => ['required', 'string', 'max:255'],
            'access_token'         => ['required', 'string'],
            'webhook_verify_token' => ['nullable', 'string', 'max:255'],
            'daily_limit'          => ['nullable', 'integer', 'min:1'],
            'messaging_tier'       => ['nullable', 'string', 'max:32'],
            'is_active'            => ['sometimes', 'boolean'],
            'department_id'        => ['nullable', 'integer', 'exists:departments,id'],
        ];
    }
}
