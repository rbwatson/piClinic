<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

class CommentRepository extends BaseRepository
{
    private const TABLE = 'comment';

    /** @return array<string,mixed>|null */
    public function findById(int $id): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::TABLE . '` WHERE `commentID` = ? LIMIT 1'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $this->getResult($stmt);
        $row    = $result->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * Search comments by optional filters. Returns newest-first.
     *
     * @param array<string,string> $filters  Supported keys: username, commentDate,
     *                                        referringUrl, referringPage.
     * @return array<int,array<string,mixed>>
     */
    public function search(array $filters): array
    {
        $conditions = [];
        $binds      = [];
        $types      = '';

        if (!empty($filters['username'])) {
            $conditions[] = '`username` LIKE ?';
            $binds[]      = '%' . $filters['username'] . '%';
            $types       .= 's';
        }
        if (!empty($filters['commentDate'])) {
            $conditions[] = 'DATE(`commentDate`) = ?';
            $binds[]      = $filters['commentDate'];
            $types       .= 's';
        }
        if (!empty($filters['referringUrl'])) {
            $conditions[] = '`referringUrl` LIKE ?';
            $binds[]      = '%' . $filters['referringUrl'] . '%';
            $types       .= 's';
        }
        if (!empty($filters['referringPage'])) {
            $conditions[] = '`referringPage` LIKE ?';
            $binds[]      = '%' . $filters['referringPage'] . '%';
            $types       .= 's';
        }

        $where = empty($conditions) ? '' : 'WHERE ' . implode(' AND ', $conditions);
        $sql   = 'SELECT * FROM `' . self::TABLE . '` ' . $where .
                 ' ORDER BY `createdDate` DESC LIMIT ' . $this->queryLimit();

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
     * Insert a new comment. Returns the auto-increment ID of the new row.
     *
     * @param array<string,mixed> $data
     */
    public function create(array $data): int
    {
        $stmt = $this->prepare(
            'INSERT INTO `' . self::TABLE . '`
             (`commentDate`, `username`, `referringUrl`, `referringPage`,
              `returnUrl`, `commentText`, `createdDate`)
             VALUES (?, ?, ?, ?, ?, ?, NOW())'
        );

        $commentDate  = $data['commentDate']  ?? null;
        $username     = $data['username']     ?? '';
        $referringUrl = $data['referringUrl'] ?? null;
        $referringPage = $data['referringPage'] ?? null;
        $returnUrl    = $data['returnUrl']    ?? null;
        $commentText  = $data['commentText']  ?? null;

        $stmt->bind_param('ssssss',
            $commentDate, $username, $referringUrl,
            $referringPage, $returnUrl, $commentText
        );
        $stmt->execute();
        $newId = (int) $this->db->insert_id;
        $stmt->close();
        return $newId;
    }
}
