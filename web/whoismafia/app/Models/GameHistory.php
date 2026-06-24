<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameHistory extends Model
{
    protected $table = 'game_history';

    protected $fillable = [
        'user_id',
        'room_code',
        'role',
        'winner',
        'player_count',
        'played_at',
    ];

    protected function casts(): array
    {
        return [
            'player_count' => 'integer',
            'played_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
