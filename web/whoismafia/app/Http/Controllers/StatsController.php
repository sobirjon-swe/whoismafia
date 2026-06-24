<?php

namespace App\Http\Controllers;

use App\Models\GameHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $stats = GameHistory::where('user_id', $userId)
            ->selectRaw("
                count(*) as total,
                sum(case
                    when (role = 'mafia' and winner = 'mafia')
                      or (role != 'mafia' and winner = 'citizen')
                    then 1 else 0
                end) as wins,
                sum(case when role = 'mafia'     then 1 else 0 end) as mafia_count,
                sum(case when role = 'detective' then 1 else 0 end) as detective_count,
                sum(case when role = 'doctor'    then 1 else 0 end) as doctor_count,
                sum(case when role = 'citizen'   then 1 else 0 end) as citizen_count
            ")
            ->first();

        $total = (int) $stats->total;
        $wins  = (int) $stats->wins;

        return response()->json([
            'total'          => $total,
            'wins'           => $wins,
            'losses'         => $total - $wins,
            'win_percent'    => $total > 0 ? round($wins / $total * 100) : 0,
            'mafia_count'    => (int) $stats->mafia_count,
            'detective_count'=> (int) $stats->detective_count,
            'doctor_count'   => (int) $stats->doctor_count,
            'citizen_count'  => (int) $stats->citizen_count,
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $history = GameHistory::where('user_id', $request->user()->id)
            ->orderBy('played_at', 'desc')
            ->paginate(20)
            ->through(fn($h) => [
                'id'           => $h->id,
                'room_code'    => $h->room_code,
                'role'         => $h->role,
                'winner'       => $h->winner,
                'player_count' => $h->player_count,
                'played_at'    => $h->played_at->toIso8601String(),
                'won'          => $this->isWin($h),
            ]);

        return response()->json($history);
    }

    private function isWin(GameHistory $h): bool
    {
        return ($h->role === 'mafia' && $h->winner === 'mafia')
            || ($h->role !== 'mafia' && $h->winner === 'citizen');
    }
}
