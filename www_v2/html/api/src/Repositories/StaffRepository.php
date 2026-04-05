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
        $result = $this->getResult($stmt);
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

    // -------------------------------------------------------------------------
    // Staff API methods (use views — password never returned)
    // -------------------------------------------------------------------------

    /**
     * Find one staff member by username, without the password field.
     * Uses the staffGetByUser view.
     *
     * @return array<string,mixed>|null
     */
    public function findOneByUsername(string $username): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `staffGetByUser` WHERE `username` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $row = $this->getResult($stmt)->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * List staff, optionally filtered by position and/or active status.
     * Sorted by lastName, firstName (staffGetByName view).
     *
     * @return array<int,array<string,mixed>>
     */
    public function findAll(?string $position = null, ?bool $active = null): array
    {
        $conditions = [];
        $binds      = [];
        $types      = '';

        if ($position !== null) {
            $conditions[] = '`position` = ?';
            $binds[]      = $position;
            $types       .= 's';
        }
        if ($active !== null) {
            $conditions[] = '`active` = ?';
            $binds[]      = (int) $active;
            $types       .= 'i';
        }

        $where = empty($conditions) ? '' : 'WHERE ' . implode(' AND ', $conditions);
        $sql   = 'SELECT * FROM `staffGetByName` ' . $where .
                 ' LIMIT ' . $this->queryLimit();

        $stmt = $this->prepare($sql);
        if (!empty($binds)) {
            $stmt->bind_param($types, ...$binds);
        }
        $stmt->execute();
        $rows = $this->getResult($stmt)->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): bool
    {
        $stmt = $this->prepare(
            'INSERT INTO `staff`
             (`username`, `lastName`, `firstName`, `position`, `password`,
              `memberID`, `preferredLanguage`, `preferredClinicPublicID`,
              `contactInfo`, `altContactInfo`, `accessGranted`, `active`, `createdDate`)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,1,NOW())'
        );

        $username               = $data['username']               ?? '';
        $lastName               = $data['lastName']               ?? '';
        $firstName              = $data['firstName']              ?? '';
        $position               = $data['position']               ?? '';
        $password               = $data['password']               ?? '';
        $memberID               = $data['memberID']               ?? null;
        $preferredLanguage      = $data['preferredLanguage']      ?? null;
        $preferredClinicPublicID = $data['preferredClinicPublicID'] ?? null;
        $contactInfo            = $data['contactInfo']            ?? null;
        $altContactInfo         = $data['altContactInfo']         ?? null;
        $accessGranted          = $data['accessGranted']          ?? 'ClinicReadOnly';

        $stmt->bind_param(
            'sssssssssss',
            $username, $lastName, $firstName, $position, $password,
            $memberID, $preferredLanguage, $preferredClinicPublicID,
            $contactInfo, $altContactInfo, $accessGranted
        );

        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    /**
     * @param array<string,mixed> $data  Fields to update (username excluded).
     */
    public function update(string $username, array $data): bool
    {
        $updatable = [
            'lastName', 'firstName', 'position', 'password',
            'memberID', 'preferredLanguage', 'preferredClinicPublicID',
            'contactInfo', 'altContactInfo', 'accessGranted', 'active',
        ];

        $sets   = [];
        $binds  = [];
        $types  = '';

        foreach ($updatable as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]  = "`{$col}` = ?";
                $binds[] = $data[$col];
                $types  .= 's';
            }
        }

        if (empty($sets)) {
            return false;
        }

        $sql     = 'UPDATE `staff` SET ' . implode(', ', $sets) .
                   ' WHERE `username` = ?';
        $binds[] = $username;
        $types  .= 's';

        $stmt = $this->prepare($sql);
        $stmt->bind_param($types, ...$binds);
        $ok       = $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $ok && $affected > 0;
    }

    public function deactivate(string $username): bool
    {
        $stmt = $this->prepare(
            'UPDATE `staff` SET `active` = 0 WHERE `username` = ? AND `active` = 1'
        );
        $stmt->bind_param('s', $username);
        $ok       = $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $ok && $affected > 0;
    }

    public function existsByUsername(string $username): bool
    {
        $stmt = $this->prepare(
            'SELECT 1 FROM `staff` WHERE `username` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $stmt->store_result();
        $found = $stmt->num_rows > 0;
        $stmt->close();
        return $found;
    }
}
