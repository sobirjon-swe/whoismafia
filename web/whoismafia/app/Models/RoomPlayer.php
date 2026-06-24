<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomPlayer extends Model
{
    protected $fillable = [
        'room_id',
        'user_id',
        'is_ready',
        'is_spectator',
    ];

    // role va is_alive faqat GameService orqali o'zgartiriladi
    protected $guarded = ['role', 'is_alive'];

    protected function casts(): array
    {
        return [
            'is_alive' => 'boolean',
            'is_ready' => 'boolean',
            'is_spectator' => 'boolean',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
