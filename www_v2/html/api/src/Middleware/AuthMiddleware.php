<?php
declare(strict_types=1);

namespace PiClinic\Middleware;

/**
 * Extracts and validates the session token on incoming requests.
 *
 * Token lookup order:
 *   1. X-Session-Token request header
 *   2. piclinic_session cookie
 *
 * Token validation against the database is handled by AuthService (Phase 1B).
 * This middleware only ensures a token is present and returns it for further
 * validation by the controller or service layer.
 */
class AuthMiddleware
{
    /**
     * Require a session token, sending 401 if none is present.
     *
     * @return string The raw session token string.
     */
    public function requireToken(): string
    {
        $token = $_SERVER['HTTP_X_SESSION_TOKEN']
            ?? $_COOKIE['piclinic_session']
            ?? '';

        if ($token === '') {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'status'  => 'error',
                'message' => 'Authentication required',
            ]);
            exit;
        }

        return $token;
    }
}
