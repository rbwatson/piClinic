<?php
declare(strict_types=1);

namespace PiClinic\Middleware;

use Monolog\Handler\RotatingFileHandler;
use Monolog\Level;
use Monolog\Logger;

/**
 * Provides a shared Monolog logger instance for the API.
 *
 * Log files rotate daily and are retained for 30 days.
 * Log level and path are controlled by LOG_LEVEL and LOG_PATH env vars.
 */
class LoggerMiddleware
{
    private static ?Logger $logger = null;

    public static function getLogger(): Logger
    {
        if (self::$logger === null) {
            $logPath  = rtrim($_ENV['LOG_PATH'] ?? '/var/log/piclinic', '/') . '/';
            $logLevel = self::resolveLevel($_ENV['LOG_LEVEL'] ?? 'warning');

            self::$logger = new Logger('piclinic');
            self::$logger->pushHandler(
                new RotatingFileHandler($logPath . 'api.log', 30, $logLevel)
            );
        }

        return self::$logger;
    }

    private static function resolveLevel(string $level): Level
    {
        return match (strtolower($level)) {
            'debug'    => Level::Debug,
            'info'     => Level::Info,
            'notice'   => Level::Notice,
            'error'    => Level::Error,
            'critical' => Level::Critical,
            default    => Level::Warning,
        };
    }
}
