<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

class IcdRepository extends BaseRepository
{
    private const VIEW = 'icd10Get';

    /**
     * Search by code OR description text.
     *
     * @return array<int,array<string,mixed>>
     */
    public function searchByCodeOrText(string $q, string $language, string $orderCol): array
    {
        $like = '%' . $q . '%';
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::VIEW . '`' .
            ' WHERE `language` = ? AND (`icd10index` LIKE ? OR `shortDescription` LIKE ?)' .
            ' ORDER BY `' . $orderCol . '`' .
            ' LIMIT ' . $this->queryLimit()
        );
        $stmt->bind_param('sss', $language, $like, $like);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * Search by description text only.
     *
     * @return array<int,array<string,mixed>>
     */
    public function searchByText(string $t, string $language, string $orderCol): array
    {
        $like = '%' . $t . '%';
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::VIEW . '`' .
            ' WHERE `language` = ? AND `shortDescription` LIKE ?' .
            ' ORDER BY `' . $orderCol . '`' .
            ' LIMIT ' . $this->queryLimit()
        );
        $stmt->bind_param('ss', $language, $like);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * Search by code index using a LIKE prefix match.
     *
     * @return array<int,array<string,mixed>>
     */
    public function searchByCode(string $c, string $language, string $orderCol): array
    {
        $like = $c . '%';
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::VIEW . '`' .
            ' WHERE `language` = ? AND `icd10index` LIKE ?' .
            ' ORDER BY `' . $orderCol . '`' .
            ' LIMIT ' . $this->queryLimit()
        );
        $stmt->bind_param('ss', $language, $like);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /** @return array<string,mixed>|null */
    public function findExactByCode(string $icd10code, string $language): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::VIEW . '`' .
            ' WHERE `language` = ? AND `icd10code` = ? LIMIT 1'
        );
        $stmt->bind_param('ss', $language, $icd10code);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }
}
