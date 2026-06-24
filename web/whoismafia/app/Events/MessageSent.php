<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Room $room,
        public array $message,
        public string $channel = 'public',
    ) {}

    public function broadcastOn(): array
    {
        if ($this->channel === 'mafia') {
            // Tundagi xabarlar faqat mafia kanaliga
            return [new PrivateChannel('game.' . $this->room->code . '.mafia')];
        }

        return [new Channel('game.' . $this->room->code)];
    }

    public function broadcastWith(): array
    {
        return ['message' => $this->message];
    }
}

