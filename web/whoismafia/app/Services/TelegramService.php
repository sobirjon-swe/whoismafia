<?php

namespace App\Services;

use App\Models\User;

class TelegramService
{
    public function verifyAndLogin(array $data): ?User
    {
        if (!$this->verifyHash($data)) {
            return null;
        }

        return User::updateOrCreate(
            ['telegram_id' => $data['id']],
            [
                'name'              => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')),
                'telegram_username' => $data['username'] ?? null,
                'avatar'            => $data['photo_url'] ?? null,
                'is_guest'          => false,
            ]
        );
    }

    private function verifyHash(array $data): bool
    {
        $token = config('services.telegram.bot_token');
        $secretKey = hash('sha256', $token, true);

        $checkHash = $data['hash'] ?? '';
        unset($data['hash']);

        ksort($data);
        $dataCheckString = implode("\n", array_map(
            fn($k, $v) => "$k=$v",
            array_keys($data),
            array_values($data)
        ));

        $hash = hash_hmac('sha256', $dataCheckString, $secretKey);

        return hash_equals($hash, $checkHash);
    }

    public function createGuestUser(string $name): User
    {
        $username = 'guest_' . bin2hex(random_bytes(4));

        return User::create([
            'name'     => $name ?: 'Guest',
            'username' => $username,
            'is_guest' => true,
        ]);
    }
}
