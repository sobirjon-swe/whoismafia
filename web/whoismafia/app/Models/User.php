<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'telegram_id',
        'telegram_username',
        'avatar',
        'is_guest',
        'is_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'telegram_id',
        'is_admin',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'telegram_id' => 'integer',
            'is_guest' => 'boolean',
            'is_admin' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->is_admin === true;
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'host_user_id');
    }

    public function roomPlayers(): HasMany
    {
        return $this->hasMany(RoomPlayer::class);
    }

    public function gameHistory(): HasMany
    {
        return $this->hasMany(GameHistory::class);
    }

    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        $initials = collect($words)->take(2)->map(fn($w) => strtoupper($w[0] ?? ''))->implode('');
        return $initials ?: 'XX';
    }
}
