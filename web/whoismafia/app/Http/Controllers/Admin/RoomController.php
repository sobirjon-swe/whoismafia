<?php

namespace App\Http\Controllers\Admin;

use App\Events\GameEnded;
use App\Http\Controllers\Controller;
use App\Models\GameHistory;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Room::with('host:id,name,username')
            ->withCount('players')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $query->where('code', 'like', '%' . $request->input('search') . '%');
        }

        return response()->json($query->paginate(20));
    }

    public function show(string $code): JsonResponse
    {
        $room = Room::with([
            'host:id,name,username,avatar',
            'players.user:id,name,username,avatar',
            'messages' => fn($q) => $q->with('user:id,name')->oldest('sent_at')->limit(50),
        ])->where('code', $code)->firstOrFail();

        return response()->json(['room' => $room]);
    }

    public function destroy(string $code): JsonResponse
    {
        $room = Room::where('code', $code)->firstOrFail();

        DB::transaction(function () use ($room) {
            $room->players()->delete();
            $room->messages()->delete();
            $room->votes()->delete();
            GameHistory::where('room_code', $room->code)->delete();
            $room->delete();
        });

        return response()->json(['message' => 'Xona o\'chirildi']);
    }

    public function forceEnd(string $code): JsonResponse
    {
        $room = Room::where('code', $code)->firstOrFail();

        if (!in_array($room->status, ['waiting', 'playing'])) {
            return response()->json(['message' => 'Xona faol emas'], 422);
        }

        DB::transaction(function () use ($room) {
            $players     = $room->players()->with('user')->get();
            $playerCount = $players->count();

            $room->update([
                'status'        => 'finished',
                'current_phase' => 'ended',
            ]);

            if ($players->isNotEmpty()) {
                GameHistory::insert(
                    $players->map(fn($p) => [
                        'user_id'      => $p->user_id,
                        'room_code'    => $room->code,
                        'role'         => $p->role,
                        'winner'       => 'none',
                        'player_count' => $playerCount,
                        'played_at'    => now(),
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ])->toArray()
                );
            }
        });

        broadcast(new GameEnded($room, 'none'))->toOthers();

        return response()->json(['message' => 'Xona majburiy tugatildi']);
    }
}
