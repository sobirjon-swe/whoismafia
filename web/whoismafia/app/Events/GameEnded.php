<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Room $room,
        public string $winner,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('game.' . $this->room->code)];
    }

    public function broadcastWith(): array
    {
        return [
            'winner' => $this->winner,
            'room_code' => $this->room->code,
        ];
    }
}

