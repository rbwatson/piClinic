<?php
declare(strict_types=1);

namespace PiClinic\Middleware;

/**
 * Sets CORS response headers and handles OPTIONS preflight requests.
 */
class CorsMiddleware
{
    public function handle(): void
    {
        $allowedOrigin = $_ENV['CORS_ALLOWED_ORIGIN'] ?? '*';

        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-Token');
        header('Access-Control-Allow-Credentials: true');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
