<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('game_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('room_code', 8);
            $table->enum('role', ['mafia', 'detective', 'doctor', 'citizen'])->nullable();
            $table->enum('winner', ['mafia', 'town'])->nullable();
            $table->integer('player_count')->nullable();
            $table->timestamp('played_at')->useCurrent();
            $table->timestamps();

            $table->index('user_id');
            $table->index('room_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_history');
    }
};
