<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerVoted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Room $room,
        public int $voterId,
        public int $targetId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('game.' . $this->room->code)];
    }

    public function broadcastWith(): array
    {
        return [
            'voter_id' => $this->voterId,
            'target_id' => $this->targetId,
        ];
    }
}

