<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'code',
        'host_user_id',
        'status',
        'player_count',
        'talk_time',
        'vote_time',
        'defense_time',
        'spectator_allowed',
        'day_count',
        'current_phase',
        'phase_ends_at',
        'accused_user_id',
    ];

    protected function casts(): array
    {
        return [
            'spectator_allowed' => 'boolean',
            'day_count' => 'integer',
            'player_count' => 'integer',
            'talk_time' => 'integer',
            'vote_time' => 'integer',
            'defense_time' => 'integer',
            'phase_ends_at' => 'datetime',
        ];
    }

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_user_id');
    }

    public function players(): HasMany
    {
        return $this->hasMany(RoomPlayer::class);
    }

    public function alivePlayers(): HasMany
    {
        return $this->hasMany(RoomPlayer::class)->where('is_alive', true);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function isHost(int $userId): bool
    {
        return $this->host_user_id === $userId;
    }

    public static function generateCode(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $code = 'MF-';
            for ($i = 0; $i < 4; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }
        } while (self::where('code', $code)->where('status', '!=', 'finished')->exists());

        return $code;
    }
}
