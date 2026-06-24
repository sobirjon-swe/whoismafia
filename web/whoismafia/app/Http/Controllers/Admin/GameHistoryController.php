<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameHistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = GameHistory::with('user:id,name,username,avatar')->latest('played_at');

        if ($request->filled('room_code')) {
            $query->where('room_code', $request->input('room_code'));
        }

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('winner')) {
            $query->where('winner', $request->input('winner'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        $history = $query->paginate(30);

        return response()->json($history);
    }

    public function byRoom(string $code): JsonResponse
    {
        $history = GameHistory::with('user:id,name,username,avatar')
            ->where('room_code', $code)
            ->get();

        return response()->json([
            'room_code'    => $code,
            'player_count' => $history->first()?->player_count ?? $history->count(),
            'winner'       => $history->first()?->winner,
            'played_at'    => $history->first()?->played_at,
            'roles'        => $history->groupBy('role')->map->count(),
            'players'      => $history,
        ]);
    }

    public function stats(): JsonResponse
    {
        $totalGames    = GameHistory::distinct('room_code')->count('room_code');
        $mafiaWins     = GameHistory::where('winner', 'mafia')->distinct('room_code')->count('room_code');
        $citizenWins   = GameHistory::where('winner', 'citizen')->distinct('room_code')->count('room_code');

        // Mafia g'alaba qilsa winner='mafia'; boshqalar g'alaba qilsa winner='citizen'
        $roleStats = GameHistory::selectRaw("
            role,
            count(*) as count,
            sum(case
                when role = 'mafia'   and winner = 'mafia'   then 1
                when role != 'mafia'  and winner = 'citizen' then 1
                else 0
            end) as wins
        ")->groupBy('role')->get();

        return response()->json([
            'total_games'  => $totalGames,
            'mafia_wins'   => $mafiaWins,
            'citizen_wins' => $citizenWins,
            'role_stats'   => $roleStats,
        ]);
    }
}
