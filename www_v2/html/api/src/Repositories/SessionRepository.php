<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

use RuntimeException;

class SessionRepository extends BaseRepository
{
    /**
     * Look up a session row by its token.
     *
     * @return array<string,mixed>|null  Full DB row, or null if not found.
     */
    public function findByToken(string $token): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `session` WHERE `token` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $result = $this->getResult($stmt);
        /** @var array<string,mixed>|null|false $row */
        $row = $result->fetch_assoc();
        $stmt->close();
        return ($row === false || $row === null) ? null : $row;
    }

    /**
     * Insert a new session row.
     *
     * @param array<string,mixed> $data  Keys: token, username, sessionIP, sessionUA,
     *                                   accessGranted, sessionLanguage,
     *                                   sessionClinicPublicID, expiresOnDate, createdDate
     */
    public function create(array $data): bool
    {
        $stmt = $this->prepare(
            'INSERT INTO `session`
                (`token`, `username`, `sessionIP`, `sessionUA`, `accessGranted`,
                 `sessionLanguage`, `sessionClinicPublicID`, `loggedIn`,
                 `expiresOnDate`, `createdDate`)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)'
        );

        $clinicId = $data['sessionClinicPublicID'] ?? null;

        $stmt->bind_param(
            'sssssssss',
            $data['token'],
            $data['username'],
            $data['sessionIP'],
            $data['sessionUA'],
            $data['accessGranted'],
            $data['sessionLanguage'],
            $clinicId,
            $data['expiresOnDate'],
            $data['createdDate']
        );

        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    /**
     * Mark a session as logged out (soft delete — preserves the row for audit).
     */
    public function setLoggedOut(string $token): bool
    {
        $stmt = $this->prepare(
            'UPDATE `session` SET `loggedIn` = 0 WHERE `token` = ?'
        );
        $stmt->bind_param('s', $token);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    /**
     * Extend the expiry of an active session.
     *
     * @return bool  True if the row was updated (session existed and was active).
     */
    public function extendExpiry(string $token, string $newExpiry): bool
    {
        $stmt = $this->prepare(
            'UPDATE `session` SET `expiresOnDate` = ?
             WHERE `token` = ? AND `loggedIn` = 1'
        );
        $stmt->bind_param('ss', $newExpiry, $token);
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $affected > 0;
    }
}
