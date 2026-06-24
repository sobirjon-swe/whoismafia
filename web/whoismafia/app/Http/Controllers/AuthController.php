<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private TelegramService $telegramService) {}

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('admin')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user->makeVisible(['is_admin']),
        ]);
    }

    public function telegram(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'required|integer',
            'first_name' => 'required|string',
            'last_name' => 'nullable|string',
            'username' => 'nullable|string',
            'photo_url' => 'nullable|url',
            'auth_date' => 'required|integer',
            'hash' => 'required|string',
        ]);

        if (abs(time() - $data['auth_date']) > 300) {
            return response()->json(['message' => 'Auth date expired'], 401);
        }

        $user = $this->telegramService->verifyAndLogin($data);
        if (!$user) {
            return response()->json(['message' => 'Invalid Telegram hash'], 401);
        }

        $token = $user->createToken('app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function guest(Request $request): JsonResponse
    {
        $request->validate(['name' => 'nullable|string|max:50']);

        $user = $this->telegramService->createGuestUser($request->input('name', 'Guest'));
        $token = $user->createToken('app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->makeVisible(['is_admin'])]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
