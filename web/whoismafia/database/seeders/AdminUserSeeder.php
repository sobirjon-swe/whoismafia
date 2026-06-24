<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'sobirjon.swe@gmail.com'],
            [
                'name'     => 'Sobirjon Admin',
                'username' => 'sobirjon_admin',
                'email'    => 'sobirjon.swe@gmail.com',
                'password' => Hash::make('sob1rjon-sWe'),
                'is_guest' => false,
                'is_admin' => true,
            ]
        );
    }
}
