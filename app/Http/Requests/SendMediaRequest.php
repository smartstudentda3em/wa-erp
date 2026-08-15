<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // حدود Meta: صور/فيديو 16MB، مستندات 100MB — نضبط سقفاً آمناً
            'file'    => ['required', 'file', 'max:16384',
                          'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,mp4,3gp,ogg,mp3'],
            'caption' => ['sometimes', 'nullable', 'string', 'max:1024'],
        ];
    }
}
