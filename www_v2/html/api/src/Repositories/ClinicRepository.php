<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

class ClinicRepository extends BaseRepository
{
    private const TABLE = 'clinic';

    /** @return array<string,mixed>|null */
    public function findThisClinic(): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::TABLE . '` WHERE `thisClinic` = 1 LIMIT 1'
        );
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /** @return array<string,mixed>|null */
    public function findByPublicID(string $publicID): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::TABLE . '` WHERE `publicID` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $publicID);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public function findByShortName(string $shortName): array
    {
        $like = '%' . $shortName . '%';
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::TABLE . '` WHERE `shortName` LIKE ?' .
            ' LIMIT ' . $this->queryLimit()
        );
        $stmt->bind_param('s', $like);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }
}
