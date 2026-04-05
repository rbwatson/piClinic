<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

use mysqli;
use mysqli_stmt;
use RuntimeException;
use PiClinic\Config\Database;

/**
 * Base class for all v2 repositories.
 *
 * Subclasses use $this->db for all database access and must use prepared
 * statements via $this->prepare() to prevent SQL injection.
 */
abstract class BaseRepository
{
    protected mysqli $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Prepare a SQL statement, throwing on failure.
     */
    protected function prepare(string $sql): mysqli_stmt
    {
        $stmt = $this->db->prepare($sql);
        if ($stmt === false) {
            throw new RuntimeException(
                'Failed to prepare statement: ' . $this->db->error
            );
        }
        return $stmt;
    }

    /**
     * Maximum number of rows to return from list queries.
     */
    protected function queryLimit(): int
    {
        return (int) ($_ENV['API_QUERY_LIMIT'] ?? 100);
    }
}
