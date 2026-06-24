<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount('gameHistory')->latest();

        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('username', 'like', "%{$term}%");
            });
        }

        if ($request->filled('type')) {
            match ($request->input('type')) {
                'admin'  => $query->where('is_admin', true),
                'guest'  => $query->where('is_guest', true),
                'member' => $query->where('is_guest', false)->where('is_admin', false),
                default  => null,
            };
        }

        $users = $query->paginate(20);
        $users->getCollection()->each->makeVisible(['is_admin']);

        return response()->json($users);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::withCount('gameHistory')
            ->with(['gameHistory' => fn($q) => $q->latest()->limit(20)])
            ->findOrFail($id);

        return response()->json(['user' => $user]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'     => 'sometimes|string|max:100',
            'username' => ['sometimes', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'email'    => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:8',
            'is_admin' => 'sometimes|boolean',
            'is_guest' => 'sometimes|boolean',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // Oxirgi adminni oddiy foydalanuvchiga aylantirishni oldini olish
        if (isset($data['is_admin']) && !$data['is_admin'] && $user->is_admin) {
            $adminCount = User::where('is_admin', true)->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Tizimda kamida 1 ta admin bo\'lishi kerak'], 422);
            }
        }

        $user->update($data);

        return response()->json(['user' => $user->fresh()->makeVisible(['is_admin'])]);
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 422);
        }

        if ($user->is_admin) {
            return response()->json(['message' => 'Cannot delete an admin account'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function toggleAdmin(int $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot change your own admin status'], 422);
        }

        $user->update(['is_admin' => !$user->is_admin]);

        return response()->json([
            'message'  => $user->is_admin ? 'Admin granted' : 'Admin revoked',
            'is_admin' => $user->is_admin,
        ]);
    }
}
