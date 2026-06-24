<?php

namespace App\Services;

class RoleService
{
    private static array $balanceTable = [
        [3, 4, 1, 0, 0],
        [5, 6, 1, 1, 0],
        [7, 9, 2, 1, 1],
        [10, 15, 3, 1, 1],
        [16, 25, 5, 2, 1],
        [26, 50, 8, 3, 2],
    ];

    public function assignRoles(array $playerIds): array
    {
        $count = count($playerIds);
        [$mafia, $detective, $doctor] = $this->getRoleCounts($count);
        $citizen = $count - $mafia - $detective - $doctor;

        $roles = array_merge(
            array_fill(0, $mafia, 'mafia'),
            array_fill(0, $detective, 'detective'),
            array_fill(0, $doctor, 'doctor'),
            array_fill(0, $citizen, 'citizen'),
        );

        shuffle($roles);

        $result = [];
        foreach ($playerIds as $i => $playerId) {
            $result[$playerId] = $roles[$i];
        }

        return $result;
    }

    private function getRoleCounts(int $playerCount): array
    {
        foreach (self::$balanceTable as [$min, $max, $mafia, $detective, $doctor]) {
            if ($playerCount >= $min && $playerCount <= $max) {
                return [$mafia, $detective, $doctor];
            }
        }
        $mafia = (int) min(floor($playerCount * 0.25), 8);
        return [$mafia, min(3, max(1, (int) floor($playerCount / 10))), 1];
    }
}
