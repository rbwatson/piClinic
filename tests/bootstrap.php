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
