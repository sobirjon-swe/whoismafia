<?php

namespace App\Http\Controllers;

use App\Models\NightAction;
use App\Models\Room;
use App\Models\RoomPlayer;
use App\Services\GameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NightActionController extends Controller
{
    public function __construct(private GameService $gameService) {}

    public function store(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'action_type' => 'required|in:kill,protect,check',
            'target_id'   => 'required|integer',
        ]);

        $room = Room::where('code', $code)->where('status', 'playing')->firstOrFail();

        if ($room->current_phase !== 'night') {
            return response()->json(['message' => 'Tun fazasi emas'], 422);
        }

        $player = RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $request->user()->id)
            ->where('is_alive', true)
            ->firstOrFail();

        $allowedActions = [
            'mafia'     => 'kill',
            'doctor'    => 'protect',
            'detective' => 'check',
        ];

        if (($allowedActions[$player->role] ?? null) !== $data['action_type']) {
            return response()->json(['message' => 'Bu harakatni bajarishga ruxsat yo\'q'], 403);
        }

        $target = RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $data['target_id'])
            ->where('is_alive', true)
            ->firstOrFail();

        if ($data['action_type'] === 'kill' && $target->user_id === $request->user()->id) {
            return response()->json(['message' => 'O\'z-o\'zingizni o\'ldira olmaysiz'], 422);
        }

        if ($data['action_type'] === 'kill' && $target->role === 'mafia') {
            return response()->json(['message' => 'Mafia a\'zosini o\'ldira olmaysiz'], 422);
        }

        NightAction::updateOrCreate(
            [
                'room_id'   => $room->id,
                'user_id'   => $request->user()->id,
                'day_count' => $room->day_count,
            ],
            [
                'action_type' => $data['action_type'],
                'target_id'   => $data['target_id'],
            ]
        );

        $response = ['message' => 'Harakat amalga oshirildi'];

        // Detektiv natijani darhol oladi
        if ($data['action_type'] === 'check') {
            $response['is_mafia'] = $target->role === 'mafia';
        }

        // Barcha maxsus rollar harakat qildi — tunni tugatish
        DB::transaction(function () use ($room) {
            $locked = Room::where('id', $room->id)->lockForUpdate()->first();
            if ($locked->current_phase !== 'night') {
                return;
            }
            $this->gameService->checkAndProcessNightActions($locked);
        });

        return response()->json($response);
    }
}
