<?php

namespace App\Services;

use App\Events\GameEnded;
use App\Events\GameStarting;
use App\Events\PhaseChanged;
use App\Events\PlayerEliminated;
use App\Models\GameHistory;
use App\Models\NightAction;
use App\Models\Room;
use App\Models\RoomPlayer;
use App\Models\Vote;
use Illuminate\Support\Facades\DB;

class GameService
{
    private const NIGHT_DURATION = 60;

    public function __construct(private RoleService $roleService) {}

    public function startGame(Room $room): void
    {
        $players = $room->players()->where('is_spectator', false)->with('user')->get();
        $playerIds = $players->pluck('user_id')->toArray();

        $roles = $this->roleService->assignRoles($playerIds);

        DB::transaction(function () use ($room, $players, $roles) {
            foreach ($players as $player) {
                $player->role     = $roles[$player->user_id];
                $player->is_alive = true;
                $player->save();
            }

            $room->update([
                'status'        => 'playing',
                'day_count'     => 1,
                'current_phase' => 'day',
                'phase_ends_at' => now()->addSeconds($room->talk_time),
            ]);
        });

        broadcast(new GameStarting($room))->toOthers();
    }

    // Ovoz berish tugaganda: ayblanuvchini aniqlash va defense fazasiga o'tish
    public function startDefense(Room $room): void
    {
        ['accused' => $accusedUserId, 'is_tie' => $isTie] = $this->resolveAccused($room);

        $room->update([
            'current_phase'  => 'defense',
            'phase_ends_at'  => now()->addSeconds($room->defense_time),
            'accused_user_id' => $accusedUserId,
        ]);

        broadcast(new PhaseChanged($room, $accusedUserId, $isTie));
    }

    // Defense tugaganda: ayblanuvchini chiqarish va tunni boshlash
    public function executeDefenseResult(Room $room): void
    {
        $accusedUserId = $room->accused_user_id;

        if ($accusedUserId) {
            $player = RoomPlayer::where('room_id', $room->id)
                ->where('user_id', $accusedUserId)
                ->where('is_alive', true)
                ->first();

            if ($player) {
                $player->is_alive = false;
                $player->save();
                broadcast(new PlayerEliminated($room, $player));
            }
        }

        if ($this->checkWinCondition($room)) {
            return;
        }

        $this->nextPhase($room, 'night');
    }

    private function resolveAccused(Room $room): array
    {
        $votes = Vote::where('room_id', $room->id)
            ->where('day_count', $room->day_count)
            ->get();

        if ($votes->isEmpty()) return ['accused' => null, 'is_tie' => false];

        $counts     = $votes->groupBy('target_id')->map->count();
        $maxVotes   = $counts->max();
        $topTargets = $counts->filter(fn($c) => $c === $maxVotes)->keys();

        $isTie = $topTargets->count() > 1;
        return ['accused' => $topTargets->sort()->first(), 'is_tie' => $isTie];
    }

    // Orqaga moslik uchun saqlanadi — processNightActions() ishlatadi
    public function processVotes(Room $room): void
    {
        $this->startDefense($room);
    }

    public function checkAndProcessNightActions(Room $room): void
    {
        $specialPlayers = RoomPlayer::where('room_id', $room->id)
            ->where('is_alive', true)
            ->whereIn('role', ['mafia', 'doctor', 'detective'])
            ->get();

        $mafiaCount     = $specialPlayers->where('role', 'mafia')->count();
        $doctorCount    = $specialPlayers->where('role', 'doctor')->count();
        $detectiveCount = $specialPlayers->where('role', 'detective')->count();

        $actions = NightAction::where('room_id', $room->id)
            ->where('day_count', $room->day_count)
            ->get();

        $killCount    = $actions->where('action_type', 'kill')->count();
        $protectCount = $actions->where('action_type', 'protect')->count();
        $checkCount   = $actions->where('action_type', 'check')->count();

        $allActed = ($mafiaCount === 0 || $killCount >= $mafiaCount)
            && ($doctorCount === 0 || $protectCount > 0)
            && ($detectiveCount === 0 || $checkCount > 0);

        if ($allActed) {
            $this->processNightActions($room);
        }
    }

    private function processNightActions(Room $room): void
    {
        $actions = NightAction::where('room_id', $room->id)
            ->where('day_count', $room->day_count)
            ->get();

        $killVotes     = $actions->where('action_type', 'kill');
        $protectTarget = $actions->firstWhere('action_type', 'protect')?->target_id;

        $killTarget = null;
        if ($killVotes->isNotEmpty()) {
            $counts     = $killVotes->groupBy('target_id')->map->count();
            $maxVotes   = $counts->max();
            $topTargets = $counts->filter(fn($c) => $c === $maxVotes)->keys();
            $killTarget = $topTargets->count() === 1 ? $topTargets->first() : $topTargets->random();
        }

        if ($killTarget && $killTarget !== $protectTarget) {
            $player = RoomPlayer::where('room_id', $room->id)
                ->where('user_id', $killTarget)
                ->where('is_alive', true)
                ->first();

            if ($player) {
                $player->is_alive = false;
                $player->save();
                broadcast(new PlayerEliminated($room, $player));
            }
        }

        if ($this->checkWinCondition($room)) {
            return;
        }

        $this->nextPhase($room, 'day');
    }

    public function nextPhase(Room $room, ?string $phase = null): void
    {
        $validPhases = ['day', 'voting', 'defense', 'night'];
        $times = [
            'day'     => $room->talk_time,
            'voting'  => $room->vote_time,
            'defense' => $room->defense_time,
            'night'   => self::NIGHT_DURATION,
        ];

        if ($phase === null) {
            $currentIndex = array_search($room->current_phase, $validPhases);
            $phase = $validPhases[($currentIndex + 1) % count($validPhases)];
        }

        if ($phase === 'day') {
            $room->increment('day_count');
        }

        $room->update([
            'current_phase' => $phase,
            'phase_ends_at' => now()->addSeconds($times[$phase] ?? self::NIGHT_DURATION),
        ]);

        broadcast(new PhaseChanged($room));
    }

    private function checkWinCondition(Room $room): bool
    {
        $alivePlayers = $room->alivePlayers()->with('user')->get();
        $mafiaCount   = $alivePlayers->where('role', 'mafia')->count();
        $townCount    = $alivePlayers->where('role', '!=', 'mafia')->count();

        if ($mafiaCount === 0) {
            $this->endGame($room, 'citizen');
            return true;
        }

        if ($mafiaCount >= $townCount) {
            $this->endGame($room, 'mafia');
            return true;
        }

        return false;
    }

    private function endGame(Room $room, string $winner): void
    {
        DB::transaction(function () use ($room, $winner) {
            $room->update(['status' => 'finished']);

            $players     = $room->players()->with('user')->get();
            $playerCount = $players->count();

            GameHistory::insert(
                $players->map(fn($p) => [
                    'user_id'      => $p->user_id,
                    'room_code'    => $room->code,
                    'role'         => $p->role,
                    'winner'       => $winner,
                    'player_count' => $playerCount,
                    'played_at'    => now(),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ])->toArray()
            );
        });

        broadcast(new GameEnded($room, $winner));
    }
}
