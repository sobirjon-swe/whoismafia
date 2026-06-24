<?php

namespace App\Events;

use App\Models\Room;
use App\Models\RoomPlayer;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerJoined implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Room $room,
        public RoomPlayer $player,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('rooms.' . $this->room->code)];
    }

    public function broadcastWith(): array
    {
        return [
            'player' => [
                'id' => $this->player->id,
                'user_id' => $this->player->user_id,
                'name' => $this->player->user->name,
                'initials' => $this->player->user->initials,
                'is_ready' => false,
                'is_alive' => true,
            ],
        ];
    }
}

