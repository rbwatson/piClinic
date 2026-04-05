<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\AuthService;

class AuthController extends BaseController
{
    public function __construct(private readonly AuthService $authService) {}

    #[OA\Post(
        path: '/auth/login',
        summary: 'Create a new session (login)',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['username', 'password'],
                properties: [
                    new OA\Property(property: 'username', type: 'string', example: 'jsmith'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Session created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/Session'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Missing credentials',    content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Invalid credentials',    content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
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

    #[OA\Get(
        path: '/auth/session',
        summary: 'Validate the current session',
        security: [['sessionToken' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(response: 200, description: 'Session is valid',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/Session'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Session invalid or expired', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function session(): never
    {
        $token = AuthMiddleware::requireToken();
        $ip    = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua    = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $session = $this->authService->validateSession($token, $ip, $ua);
        $this->success($session->toArray());
    }

    #[OA\Post(
        path: '/auth/logout',
        summary: 'Terminate the current session (logout)',
        security: [['sessionToken' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(response: 200, description: 'Logged out',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   nullable: true, example: null),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function logout(): never
    {
        $token = AuthMiddleware::requireToken();
        $this->authService->logout($token);
        $this->success(null);
    }

    #[OA\Post(
        path: '/auth/refresh',
        summary: 'Extend the current session expiry',
        security: [['sessionToken' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(response: 200, description: 'Session refreshed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/Session'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Session invalid or expired', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function refresh(): never
    {
        $token = AuthMiddleware::requireToken();
        $ip    = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua    = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $session = $this->authService->refresh($token, $ip, $ua);
        $this->success($session->toArray());
    }
}
