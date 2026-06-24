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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->foreignId('host_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['waiting', 'playing', 'finished'])->default('waiting');
            $table->integer('player_count')->default(8);
            $table->integer('talk_time')->default(120);
            $table->integer('vote_time')->default(60);
            $table->integer('defense_time')->default(30);
            $table->boolean('spectator_allowed')->default(false);
            $table->integer('day_count')->default(0);
            $table->enum('current_phase', ['waiting', 'day', 'voting', 'defense', 'night'])->default('waiting');
            $table->timestamp('phase_ends_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
