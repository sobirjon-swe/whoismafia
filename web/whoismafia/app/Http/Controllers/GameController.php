<?php

namespace App\Http\Controllers;

use App\Events\PlayerVoted;
use App\Models\GameHistory;
use App\Models\NightAction;
use App\Models\Room;
use App\Models\RoomPlayer;
use App\Models\Vote;
use App\Services\GameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    public function __construct(private GameService $gameService) {}

    public function state(Request $request, string $code): JsonResponse
    {
        $room = Room::where('code', $code)->firstOrFail();
        $myPlayer = RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $request->user()->id)
            ->first();

        $room->load(['players.user']);

        // N+1 fix: barcha votlarni bitta query bilan olamiz
        $voteCounts = Vote::where('room_id', $room->id)
            ->where('day_count', $room->day_count)
            ->selectRaw('target_id, count(*) as cnt')
            ->groupBy('target_id')
            ->pluck('cnt', 'target_id');

        $nightActionSubmitted = ($myPlayer && $room->current_phase === 'night')
            ? NightAction::where('room_id', $room->id)
                ->where('user_id', $request->user()->id)
                ->where('day_count', $room->day_count)
                ->exists()
            : false;

        return response()->json([
            'room' => [
                'code'          => $room->code,
                'status'        => $room->status,
                'day_count'     => $room->day_count,
                'current_phase' => $room->current_phase,
                'phase_ends_at' => $room->phase_ends_at?->utc()->timestamp,
                'talk_time'     => $room->talk_time,
                'vote_time'     => $room->vote_time,
                'defense_time'  => $room->defense_time,
            ],
            'my_role'               => $myPlayer?->role,
            'my_player_id'          => $myPlayer?->id,
            'is_host'               => $room->isHost($request->user()->id),
            'accused_user_id'       => $room->accused_user_id,
            'night_action_submitted' => $nightActionSubmitted,
            'mafia_team'            => $myPlayer?->role === 'mafia'
                ? $room->players->where('role', 'mafia')->where('is_alive', true)->pluck('user_id')->values()
                : [],
            'players'      => $room->players->map(fn($p) => [
                'id'          => $p->id,
                'user_id'     => $p->user_id,
                'name'        => $p->user->name,
                'initials'    => $p->user->initials,
                'avatar'      => $p->user->avatar,
                'is_alive'    => $p->is_alive,
                'is_me'       => $p->user_id === $request->user()->id,
                'role'        => ($p->user_id === $request->user()->id || !$p->is_alive)
                    ? $p->role
                    : null,
                'votes'       => $voteCounts[$p->user_id] ?? 0,
            ]),
        ]);
    }

    public function vote(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'target_id' => 'required|integer',
        ]);

        $responded = null;

        DB::transaction(function () use ($request, $code, $data, &$responded) {
            $room = Room::where('code', $code)
                ->where('status', 'playing')
                ->lockForUpdate()
                ->firstOrFail();

            if ($room->current_phase !== 'voting') {
                $responded = response()->json(['message' => 'Ovoz berish vaqti emas'], 422);
                return;
            }

            $voter = RoomPlayer::where('room_id', $room->id)
                ->where('user_id', $request->user()->id)
                ->where('is_alive', true)
                ->firstOrFail();

            $target = RoomPlayer::where('room_id', $room->id)
                ->where('user_id', $data['target_id'])
                ->where('is_alive', true)
                ->firstOrFail();

            $vote = Vote::firstOrCreate(
                [
                    'room_id'   => $room->id,
                    'voter_id'  => $request->user()->id,
                    'day_count' => $room->day_count,
                ],
                ['target_id' => $data['target_id']]
            );

            if (!$vote->wasRecentlyCreated) {
                $responded = response()->json(['message' => 'Ovoz allaqachon berilgan'], 422);
                return;
            }

            broadcast(new PlayerVoted($room, $request->user()->id, $data['target_id']));

            $aliveCount = $room->alivePlayers()->count();
            $voteCount  = Vote::where('room_id', $room->id)->where('day_count', $room->day_count)->count();

            if ($aliveCount === $voteCount) {
                // Hamma ovoz berdi — defense fazasini boshlaymiz
                $this->gameService->startDefense($room);
            }
        });

        return $responded ?? response()->json(['message' => 'Ovoz berildi']);
    }

    public function advancePhase(Request $request, string $code): JsonResponse
    {
        $fromPhase = $request->input('from_phase');
        $result    = null;

        DB::transaction(function () use ($code, $fromPhase, &$result) {
            $room = Room::where('code', $code)
                ->where('status', 'playing')
                ->lockForUpdate()
                ->firstOrFail();

            // Boshqa so'rov allaqachon fazani o'zgartirgan — idempotent no-op
            if ($fromPhase && $room->current_phase !== $fromPhase) {
                $result = response()->json(['message' => 'Faza allaqachon o\'zgartirildi']);
                return;
            }

            $allowedTransitions = [
                'day'     => 'voting',
                'voting'  => 'defense',
                'defense' => 'night',
                'night'   => 'day',
            ];

            if (!isset($allowedTransitions[$room->current_phase])) {
                $result = response()->json(['message' => 'Bu fazadan o\'tish mumkin emas'], 422);
                return;
            }

            if ($room->current_phase === 'voting') {
                // Ovoz berish tugadi — defense fazasiga o'tamiz, HALI chiqarmaymiz
                $this->gameService->startDefense($room);
            } elseif ($room->current_phase === 'defense') {
                // Defense tugadi — endi ayblanuvchini chiqaramiz
                $this->gameService->executeDefenseResult($room);
            } else {
                $this->gameService->nextPhase($room, $allowedTransitions[$room->current_phase]);
            }

            $result = response()->json(['message' => 'Faza o\'zgartirildi']);
        });

        return $result;
    }

    public function results(string $code): JsonResponse
    {
        $room = Room::where('code', $code)->where('status', 'finished')->firstOrFail();
        $room->load(['players.user']);

        $winner = GameHistory::where('room_code', $code)->value('winner');

        return response()->json([
            'room'    => ['code' => $room->code, 'day_count' => $room->day_count, 'winner' => $winner],
            'players' => $room->players->map(fn($p) => [
                'id'       => $p->id,
                'user_id'  => $p->user_id,
                'name'     => $p->user->name,
                'initials' => $p->user->initials,
                'avatar'   => $p->user->avatar,
                'role'     => $p->role,
                'is_alive' => $p->is_alive,
            ]),
        ]);
    }
}
