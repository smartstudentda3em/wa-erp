<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWhatsappAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('whatsapp_account')->id;

        return [
            'label'                => ['sometimes', 'string', 'max:255'],
            'display_phone_number' => ['sometimes', 'string', 'max:32'],
            'phone_number_id'      => ['sometimes', 'string', Rule::unique('whatsapp_accounts', 'phone_number_id')->ignore($id)],
            'waba_id'              => ['sometimes', 'string', 'max:255'],
            'access_token'         => ['nullable', 'string'], // فارغ = إبقاء القيمة الحالية
            'webhook_verify_token' => ['nullable', 'string', 'max:255'],
            'daily_limit'          => ['nullable', 'integer', 'min:1'],
            'messaging_tier'       => ['nullable', 'string', 'max:32'],
            'is_active'            => ['sometimes', 'boolean'],
        ];
    }
}
