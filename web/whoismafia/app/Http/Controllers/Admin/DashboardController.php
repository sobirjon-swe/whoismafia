<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameHistory;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalUsers    = User::where('is_guest', false)->count();
        $guestUsers    = User::where('is_guest', true)->count();
        $totalRooms    = Room::count();
        $activeRooms   = Room::whereIn('status', ['waiting', 'playing'])->count();
        $finishedGames = Room::where('status', 'finished')->count();
        $totalGames    = GameHistory::distinct('room_code')->count('room_code');

        $recentGames = Room::with('host:id,name,username')
            ->latest()
            ->limit(10)
            ->get(['id', 'code', 'status', 'player_count', 'host_user_id', 'created_at']);

        $topPlayers = User::withCount('gameHistory')
            ->where('is_guest', false)
            ->orderByDesc('game_history_count')
            ->limit(10)
            ->get(['id', 'name', 'username', 'avatar']);

        return response()->json([
            'stats' => [
                'total_users'    => $totalUsers,
                'guest_users'    => $guestUsers,
                'total_rooms'    => $totalRooms,
                'active_rooms'   => $activeRooms,
                'finished_games' => $finishedGames,
                'total_games'    => $totalGames,
            ],
            'recent_games' => $recentGames,
            'top_players'  => $topPlayers,
        ]);
    }
}
