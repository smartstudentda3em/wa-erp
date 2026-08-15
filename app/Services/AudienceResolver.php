<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Collection;

/**
 * يبني جمهور الحملة من معايير audience_filter.
 * مستخرَج في صنف مستقل (DRY) ليُستخدم في الـ Controller (المعاينة) والـ Job (التنفيذ).
 *
 * أمثلة الفلتر:
 *   ['tags' => ['VIP', 'جديد'], 'source' => 'whatsapp']
 *   ['all' => true]  // كل العملاء
 */
class AudienceResolver
{
    public function resolve(?array $filter): Collection
    {
        $filter ??= [];

        return Customer::query()
            ->whereNotNull('phone')
            ->when($filter['tags'] ?? null, function ($q, $tags) {
                $q->where(function ($w) use ($tags) {
                    foreach ((array) $tags as $tag) {
                        $w->orWhereJsonContains('tags', $tag);
                    }
                });
            })
            ->when($filter['source'] ?? null, fn ($q, $s) => $q->where('source', $s))
            ->when($filter['assigned_to'] ?? null, fn ($q, $id) => $q->where('assigned_to', $id))
            ->get();
    }

    public function count(?array $filter): int
    {
        return $this->resolve($filter)->count();
    }
}
