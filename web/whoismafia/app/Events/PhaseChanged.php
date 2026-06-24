<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PhaseChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Room $room,
        public ?int $accusedUserId = null,
        public bool $isTie = false,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('game.' . $this->room->code)];
    }

    public function broadcastWith(): array
    {
        return [
            'phase'           => $this->room->current_phase,
            'day_count'       => $this->room->day_count,
            'phase_ends_at'   => $this->room->phase_ends_at?->toIso8601String(),
            'accused_user_id' => $this->accusedUserId,
            'is_tie'          => $this->isTie,
        ];
    }
}

