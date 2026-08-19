<?php

namespace App\Policies;

use App\Models\BroadcastCampaign;
use App\Models\User;

/**
 * سياسة الحملات — تُكتشف تلقائياً لموديل BroadcastCampaign في Laravel 11.
 * إدارة الحملات محصورة بصلاحية campaigns.manage (admin / manager).
 */
class CampaignPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if (! $user->is_active) {
            return false;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BroadcastCampaign $campaign): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can('campaigns.manage');
    }

    public function launch(User $user, BroadcastCampaign $campaign): bool
    {
        return $user->can('campaigns.manage');
    }

    public function cancel(User $user, BroadcastCampaign $campaign): bool
    {
        return $user->can('campaigns.manage');
    }
}
