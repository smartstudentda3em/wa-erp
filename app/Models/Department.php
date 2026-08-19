<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * نشاط/قسم تجاري (تكييف، قرطاسية، مطبعة ...).
 * يُوجَّه إليه المحادثات ثم يُوزَّع round-robin بين موظفيه.
 */
class Department extends Model
{
    protected $fillable = ['name', 'code', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    /** موظفو (سيلز) هذا القسم */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** أرقام واتساب المرتبطة بهذا النشاط */
    public function whatsappAccounts(): HasMany
    {
        return $this->hasMany(WhatsappAccount::class);
    }
}
