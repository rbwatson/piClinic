<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

class LogRepository extends BaseRepository
{
    private const TABLE = 'log';

    /** @return array<string,mixed>|null */
    public function findById(int $id): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::TABLE . '` WHERE `logId` = ? LIMIT 1'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $this->getResult($stmt);
        $row    = $result->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * Search log entries by optional filters. Returns newest-first.
     *
     * @param array<string,string> $filters  Supported keys: logDate, logClass, sourceModule.
     * @return array<int,array<string,mixed>>
     */
    public function search(array $filters): array
    {
        $conditions = [];
        $binds      = [];
        $types      = '';

        if (!empty($filters['logDate'])) {
            $conditions[] = 'DATE(`createdDate`) = ?';
            $binds[]      = $filters['logDate'];
            $types       .= 's';
        }
        if (!empty($filters['logClass'])) {
            $conditions[] = '`logClass` = ?';
            $binds[]      = $filters['logClass'];
            $types       .= 's';
        }
        if (!empty($filters['sourceModule'])) {
            $conditions[] = '`sourceModule` LIKE ?';
            $binds[]      = '%' . $filters['sourceModule'] . '%';
            $types       .= 's';
        }

        $where = empty($conditions) ? '' : 'WHERE ' . implode(' AND ', $conditions);
        $sql   = 'SELECT * FROM `' . self::TABLE . '` ' . $where .
                 ' ORDER BY `createdDate` DESC, `logId` DESC LIMIT ' . $this->queryLimit();

        $stmt = $this->prepare($sql);
        if (!empty($binds)) {
            $stmt->bind_param($types, ...$binds);
        }
        $stmt->execute();
        $result = $this->getResult($stmt);
        $rows   = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * Insert a new log entry. Returns the auto-increment ID of the new row.
     *
     * @param array<string,mixed> $data
     */
    public function create(array $data): int
    {
        $stmt = $this->prepare(
            'INSERT INTO `' . self::TABLE . '`
             (`sourceModule`, `userToken`, `logClass`, `logTable`, `logAction`,
              `logQueryString`, `logBeforeData`, `logAfterData`,
              `logStatusCode`, `logStatusMessage`, `createdDate`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );

        $sourceModule     = $data['sourceModule']     ?? null;
        $userToken        = $data['userToken']        ?? '';
        $logClass         = $data['logClass']         ?? '';
        $logTable         = $data['logTable']         ?? null;
        $logAction        = $data['logAction']        ?? null;
        $logQueryString   = $data['logQueryString']   ?? null;
        $logBeforeData    = $data['logBeforeData']    ?? null;
        $logAfterData     = $data['logAfterData']     ?? null;
        $logStatusCode    = $data['logStatusCode']    ?? null;
        $logStatusMessage = $data['logStatusMessage'] ?? '';

        $stmt->bind_param('ssssssssss',
            $sourceModule, $userToken, $logClass, $logTable, $logAction,
            $logQueryString, $logBeforeData, $logAfterData,
            $logStatusCode, $logStatusMessage
        );
        $stmt->execute();
        $newId = (int) $this->db->insert_id;
        $stmt->close();
        return $newId;
    }
}
