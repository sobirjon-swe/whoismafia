<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. night_actions jadvali
        Schema::create('night_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('day_count');
            $table->enum('action_type', ['kill', 'protect', 'check']);
            $table->unsignedBigInteger('target_id');
            $table->timestamps();

            $table->unique(['room_id', 'user_id', 'day_count']);
            $table->index(['room_id', 'day_count']);
            $table->index('target_id');
        });

        // 2. Performans uchun indexlar
        Schema::table('room_players', function (Blueprint $table) {
            $table->index('user_id');
            $table->index(['room_id', 'is_alive']);
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->index('voter_id');
            $table->index('target_id');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->index(['host_user_id', 'status']);
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->index('user_id');
            $table->index(['room_id', 'phase']);
        });

        // 3. game_history.winner: 'town' → 'citizen'
        DB::statement("UPDATE game_history SET winner = 'citizen' WHERE winner = 'town'");
        DB::statement("ALTER TABLE game_history DROP CONSTRAINT IF EXISTS game_history_winner_check");
        DB::statement("ALTER TABLE game_history ADD CONSTRAINT game_history_winner_check
            CHECK (winner IN ('mafia', 'citizen', 'none'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('night_actions');

        Schema::table('room_players', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['room_id', 'is_alive']);
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->dropIndex(['voter_id']);
            $table->dropIndex(['target_id']);
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropIndex(['host_user_id', 'status']);
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['room_id', 'phase']);
        });

        DB::statement("UPDATE game_history SET winner = 'town' WHERE winner = 'citizen'");
        DB::statement("ALTER TABLE game_history DROP CONSTRAINT IF EXISTS game_history_winner_check");
        DB::statement("ALTER TABLE game_history ADD CONSTRAINT game_history_winner_check
            CHECK (winner IN ('mafia', 'town'))");
    }
};
