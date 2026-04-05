<?php
declare(strict_types=1);

// Load the API autoloader (includes all PiClinic source classes and Composer deps)
$autoloader = __DIR__ . '/../www_v2/html/api/vendor/autoload.php';

if (!file_exists($autoloader)) {
    fwrite(STDERR, "Autoloader not found at {$autoloader}.\n");
    fwrite(STDERR, "Run: composer install --working-dir www_v2/html/api\n");
    exit(1);
}

require_once $autoloader;

// Load a test-specific .env if present (avoids polluting production config)
$envFile = __DIR__ . '/../www_v2/html/api/.env.test';
if (file_exists($envFile)) {
    $dotenv = Dotenv\Dotenv::createImmutable(dirname($envFile), '.env.test');
    $dotenv->safeLoad();
}

// Set test defaults for any env vars not provided by .env.test.
// These must be set before the first test runs so that singletons like
// LoggerMiddleware pick them up before they are initialised.
$_ENV['LOG_PATH']  = $_ENV['LOG_PATH']  ?? sys_get_temp_dir() . '/';
$_ENV['LOG_LEVEL'] = $_ENV['LOG_LEVEL'] ?? 'debug';
