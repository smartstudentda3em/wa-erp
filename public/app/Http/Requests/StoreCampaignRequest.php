<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                => ['required', 'string', 'max:255'],
            'whatsapp_account_id' => ['required', 'exists:whatsapp_accounts,id'],
            'message_template_id' => ['required', 'exists:message_templates,id'],
            'audience_filter'     => ['nullable', 'array'],
            'default_params'      => ['nullable', 'array'],   // خريطة {"1":"name"}
            'scheduled_at'        => ['nullable', 'date', 'after:now'],
        ];
    }
}
