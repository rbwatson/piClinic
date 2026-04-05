<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\AuthService;

class AuthController extends BaseController
{
    public function __construct(private readonly AuthService $authService) {}

    /**
     * POST /api/v2/auth/login
     *
     * Body (JSON): { "username": "...", "password": "..." }
     * Response 201: session data
     */
    public function login(): never
    {
        /** @var array<string,mixed> $body */
        $body = json_decode(file_get_contents('php://input') ?: '', true) ?? [];

        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $ip       = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua       = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $session = $this->authService->login($username, $password, $ip, $ua);
        $this->success($session->toArray(), 201);
    }

    /**
     * GET /api/v2/auth/session
     *
     * Header: X-Session-Token: <token>
     * Response 200: session data
     */
    public function session(): never
    {
        $token = (new AuthMiddleware())->requireToken();
        $ip    = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua    = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $session = $this->authService->validateSession($token, $ip, $ua);
        $this->success($session->toArray());
    }

    /**
     * POST /api/v2/auth/logout
     *
     * Header: X-Session-Token: <token>
     * Response 200: empty data
     */
    public function logout(): never
    {
        $token = (new AuthMiddleware())->requireToken();
        $this->authService->logout($token);
        $this->success(null);
    }

    /**
     * POST /api/v2/auth/refresh
     *
     * Header: X-Session-Token: <token>
     * Response 200: session data with updated expiresOnDate
     */
    public function refresh(): never
    {
        $token = (new AuthMiddleware())->requireToken();
        $ip    = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua    = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $session = $this->authService->refresh($token, $ip, $ua);
        $this->success($session->toArray());
    }
}
