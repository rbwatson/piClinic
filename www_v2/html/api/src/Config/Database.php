<?php
declare(strict_types=1);

namespace PiClinic\Config;

use mysqli;
use RuntimeException;

/**
 * Provides a single shared database connection for the request lifecycle.
 */
class Database
{
    private static ?mysqli $connection = null;

    public static function getConnection(): mysqli
    {
        if (self::$connection === null) {
            $host     = $_ENV['DB_HOST']     ?? 'localhost';
            $user     = $_ENV['DB_USER']     ?? '';
            $password = $_ENV['DB_PASSWORD'] ?? '';
            $name     = $_ENV['DB_NAME']     ?? '';

            self::$connection = new mysqli($host, $user, $password, $name);

            if (self::$connection->connect_error) {
                throw new RuntimeException(
                    'Database connection failed: ' . self::$connection->connect_error
                );
            }

            self::$connection->set_charset('utf8mb4');
        }

        return self::$connection;
    }

    public static function closeConnection(): void
    {
        if (self::$connection !== null) {
            self::$connection->close();
            self::$connection = null;
        }
    }
}
