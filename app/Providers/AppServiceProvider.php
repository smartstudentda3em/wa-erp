<?php

namespace App\Providers;

use App\Models\BroadcastCampaign;
use App\Policies\CampaignPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // اسم السياسة (CampaignPolicy) لا يطابق اسم الموديل (BroadcastCampaign)،
        // فلا يكتشفها Laravel تلقائياً — نربطها يدوياً.
        Gate::policy(BroadcastCampaign::class, CampaignPolicy::class);
    }
}
