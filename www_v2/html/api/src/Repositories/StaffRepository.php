<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

class StaffRepository extends BaseRepository
{
    /**
     * Look up a staff row by username.
     *
     * @return array<string,mixed>|null  Full DB row, or null if not found.
     */
    public function findByUsername(string $username): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `staff` WHERE `username` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result();
        /** @var array<string,mixed>|null|false $row */
        $row = $result->fetch_assoc();
        $stmt->close();
        return ($row === false || $row === null) ? null : $row;
    }

    /**
     * Update the lastLogin timestamp for a staff member.
     */
    public function updateLastLogin(int $staffId, string $datetime): bool
    {
        $stmt = $this->prepare(
            'UPDATE `staff` SET `lastLogin` = ? WHERE `staffID` = ?'
        );
        $stmt->bind_param('si', $datetime, $staffId);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }
}
