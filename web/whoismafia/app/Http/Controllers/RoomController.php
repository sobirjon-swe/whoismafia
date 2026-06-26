<?php

namespace App\Http\Controllers;

use App\Events\PlayerJoined;
use App\Events\PlayerReady;
use App\Models\Room;
use App\Models\RoomPlayer;
use App\Services\GameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomController extends Controller
{
    public function __construct(private GameService $gameService) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'player_count'      => 'integer|min:3|max:50',
            'talk_time'         => 'integer|min:10|max:600',
            'vote_time'         => 'integer|min:10|max:300',
            'defense_time'      => 'integer|min:10|max:180',
            'spectator_allowed' => 'boolean',
        ]);

        $room = Room::create([
            'code'              => Room::generateCode(),
            'host_user_id'      => $request->user()->id,
            'status'            => 'waiting',
            'player_count'      => $data['player_count'] ?? 8,
            'talk_time'         => $data['talk_time'] ?? 120,
            'vote_time'         => $data['vote_time'] ?? 60,
            'defense_time'      => $data['defense_time'] ?? 30,
            'spectator_allowed' => $data['spectator_allowed'] ?? false,
            'day_count'         => 0,
            'current_phase'     => 'waiting',
        ]);

        RoomPlayer::create([
            'room_id'  => $room->id,
            'user_id'  => $request->user()->id,
            'is_ready' => true,
        ]);

        return response()->json($this->roomWithPlayers($room, $request->user()->id), 201);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $room = Room::where('code', $code)->firstOrFail();

        return response()->json($this->roomWithPlayers($room, $request->user()->id));
    }

    public function join(Request $request, string $code): JsonResponse
    {
        $room = Room::where('code', $code)->where('status', 'waiting')->firstOrFail();

        $existing = RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json($this->roomWithPlayers($room, $request->user()->id));
        }

        $currentCount = $room->players()->where('is_spectator', false)->count();
        $isSpectator  = $room->spectator_allowed && $currentCount >= $room->player_count;

        if (!$room->spectator_allowed && $currentCount >= $room->player_count) {
            return response()->json(['message' => 'Xona to\'la'], 422);
        }

        $player = RoomPlayer::create([
            'room_id'      => $room->id,
            'user_id'      => $request->user()->id,
            'is_spectator' => $isSpectator,
        ]);

        broadcast(new PlayerJoined($room, $player->load('user')));

        return response()->json($this->roomWithPlayers($room, $request->user()->id));
    }

    public function ready(Request $request, string $code): JsonResponse
    {
        $room   = Room::where('code', $code)->firstOrFail();
        $player = RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $player->update(['is_ready' => !$player->is_ready]);

        broadcast(new PlayerReady($room, $player->load('user')));

        return response()->json(['is_ready' => $player->is_ready]);
    }

    public function start(Request $request, string $code): JsonResponse
    {
        $room = Room::where('code', $code)->firstOrFail();

        if ($room->status === 'playing') {
            return response()->json(['message' => 'O\'yin allaqachon boshlangan', 'already_started' => true], 422);
        }

        if ($room->status !== 'waiting') {
            return response()->json(['message' => 'Xona faol emas'], 422);
        }

        if (!$room->isHost($request->user()->id)) {
            return response()->json(['message' => 'Faqat host o\'yinni boshlashi mumkin'], 403);
        }

        // Host o'yinni boshlaganda avtomatik tayyor bo'ladi
        RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $request->user()->id)
            ->update(['is_ready' => true]);

        $totalCount = $room->players()->where('is_spectator', false)->count();
        $readyCount = $room->players()->where('is_ready', true)->where('is_spectator', false)->count();

        if ($totalCount < 3) {
            return response()->json(['message' => 'Kamida 3 o\'yinchi kerak'], 422);
        }

        if ($readyCount < $totalCount) {
            return response()->json(['message' => 'Barcha o\'yinchilar tayyor emas'], 422);
        }

        DB::transaction(function () use ($room) {
            $locked = Room::where('id', $room->id)
                ->where('status', 'waiting')
                ->lockForUpdate()
                ->first();

            if ($locked) {
                $this->gameService->startGame($locked);
            }
        });

        return response()->json(['message' => 'O\'yin boshlandi']);
    }

    private function roomWithPlayers(Room $room, int $currentUserId): array
    {
        $room->load(['players.user', 'host']);

        return [
            'id'                => $room->id,
            'code'              => $room->code,
            'status'            => $room->status,
            'host_user_id'      => $room->host_user_id,
            'player_count'      => $room->player_count,
            'talk_time'         => $room->talk_time,
            'vote_time'         => $room->vote_time,
            'defense_time'      => $room->defense_time,
            'spectator_allowed' => $room->spectator_allowed,
            'day_count'         => $room->day_count,
            'current_phase'     => $room->current_phase,
            'phase_ends_at'     => $room->phase_ends_at?->utc()->timestamp,
            'players'           => $room->players->map(fn($p) => [
                'id'           => $p->id,
                'user_id'      => $p->user_id,
                'name'         => $p->user->name,
                'initials'     => $p->user->initials,
                'avatar'       => $p->user->avatar,
                'is_alive'     => $p->is_alive,
                'is_ready'     => $p->is_ready,
                'is_spectator' => $p->is_spectator,
                // Rol faqat o'z egasiga yoki o'lgan o'yinchilarga ko'rinadi
                'role'         => $room->status === 'waiting'
                    ? null
                    : (($p->user_id === $currentUserId || !$p->is_alive) ? $p->role : null),
            ]),
        ];
    }
}
