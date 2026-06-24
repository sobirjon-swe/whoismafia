<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        // Login: 5 urinish/daqiqa (IP bo'yicha)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Guest yaratish: 10 ta/soat (IP bo'yicha)
        RateLimiter::for('guest-create', function (Request $request) {
            return Limit::perHour(10)->by($request->ip());
        });

        // Chat: 30 ta xabar/daqiqa (foydalanuvchi bo'yicha)
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });
    }
}
