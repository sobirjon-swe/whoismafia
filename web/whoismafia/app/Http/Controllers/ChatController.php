<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\ChatMessage;
use App\Models\Room;
use App\Models\RoomPlayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request, string $code): JsonResponse
    {
        $room = Room::where('code', $code)->firstOrFail();

        // Foydalanuvchi bu xonada bo'lganligini tekshirish
        $myPlayer = RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$myPlayer) {
            return response()->json(['message' => 'Bu xonaga kirishga ruxsat yo\'q'], 403);
        }

        $query = ChatMessage::where('room_id', $room->id)->with('user')->orderBy('sent_at');

        // Mafia bo'lmaganlar tundagi xabarlarni ko'rmaydi
        if ($myPlayer->role !== 'mafia') {
            $query->where('phase', '!=', 'night');
        }

        $messages = $query->get()->map(fn($m) => [
            'id'      => $m->id,
            'user_id' => $m->user_id,
            'name'    => $m->user->name,
            'initials'=> $m->user->initials,
            'message' => $m->message,
            'phase'   => $m->phase,
            'sent_at' => $m->sent_at->toIso8601String(),
        ]);

        return response()->json(['messages' => $messages]);
    }

    public function store(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $room = Room::where('code', $code)->firstOrFail();

        $player = RoomPlayer::where('room_id', $room->id)
            ->where('user_id', $request->user()->id)
            ->where('is_alive', true)
            ->where('is_spectator', false)
            ->firstOrFail();

        if ($room->current_phase === 'night' && $player->role !== 'mafia') {
            return response()->json(['message' => 'Tunda faqat mafia gaplasha oladi'], 403);
        }

        $message = ChatMessage::create([
            'room_id'  => $room->id,
            'user_id'  => $request->user()->id,
            'message'  => $data['message'],
            'phase'    => $room->current_phase === 'night' ? 'night' : 'day',
            'sent_at'  => now(),
        ]);

        $message->load('user');

        $payload = [
            'id'      => $message->id,
            'user_id' => $message->user_id,
            'name'    => $message->user->name,
            'initials'=> $message->user->initials,
            'message' => $message->message,
            'phase'   => $message->phase,
            'sent_at' => $message->sent_at->toIso8601String(),
        ];

        // Tundagi mafia xabarlari faqat mafia kanaliga broadcast qilinadi
        if ($message->phase === 'night') {
            broadcast(new MessageSent($room, $payload, 'mafia'));
        } else {
            broadcast(new MessageSent($room, $payload));
        }

        return response()->json($payload, 201);
    }
}
