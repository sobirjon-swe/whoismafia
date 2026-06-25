<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GameHistoryController;
use App\Http\Controllers\Admin\RoomController as AdminRoomController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\NightActionController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\StatsController;
use Illuminate\Support\Facades\Route;

// Auth (public) — rate limited
Route::middleware('throttle:auth')->group(function () {
    Route::post('/auth/login',    [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/telegram', [AuthController::class, 'telegram']);
});

Route::middleware('throttle:guest-create')->post('/auth/guest', [AuthController::class, 'guest']);

// Auth (protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Rooms
    Route::post('/rooms',                [RoomController::class, 'store']);
    Route::get('/rooms/{code}',          [RoomController::class, 'show']);
    Route::post('/rooms/{code}/join',    [RoomController::class, 'join']);
    Route::post('/rooms/{code}/ready',   [RoomController::class, 'ready']);
    Route::post('/rooms/{code}/start',   [RoomController::class, 'start']);

    // Game
    Route::get('/game/{code}/state',          [GameController::class, 'state']);
    Route::post('/game/{code}/vote',          [GameController::class, 'vote']);
    Route::post('/game/{code}/advance-phase', [GameController::class, 'advancePhase']);
    Route::get('/game/{code}/results',        [GameController::class, 'results']);

    // Night actions
    Route::post('/game/{code}/night-action', [NightActionController::class, 'store']);

    // Chat — rate limited
    Route::get('/game/{code}/messages',  [ChatController::class, 'index']);
    Route::middleware('throttle:chat')->post('/game/{code}/messages', [ChatController::class, 'store']);

    // Stats
    Route::get('/stats',   [StatsController::class, 'stats']);
    Route::get('/history', [StatsController::class, 'history']);

    // Admin
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Users
        Route::get('/users',                         [AdminUserController::class, 'index']);
        Route::get('/users/{id}',                    [AdminUserController::class, 'show']);
        Route::put('/users/{id}',                    [AdminUserController::class, 'update']);
        Route::delete('/users/{id}',                 [AdminUserController::class, 'destroy']);
        Route::post('/users/{id}/toggle-admin',      [AdminUserController::class, 'toggleAdmin']);

        // Rooms
        Route::get('/rooms',                         [AdminRoomController::class, 'index']);
        Route::get('/rooms/{code}',                  [AdminRoomController::class, 'show']);
        Route::delete('/rooms/{code}',               [AdminRoomController::class, 'destroy']);
        Route::post('/rooms/{code}/force-end',       [AdminRoomController::class, 'forceEnd']);

        // Game history
        Route::get('/game-history',        [GameHistoryController::class, 'index']);
        Route::get('/game-history/stats',  [GameHistoryController::class, 'stats']);
        Route::get('/game-history/{code}', [GameHistoryController::class, 'byRoom']);
    });
});
