<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\LogService;

class LogController extends BaseController
{
    public function __construct(private LogService $logService) {}

    /**
     * GET /api/v2/log
     *
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/log',
        operationId: 'searchLog',
        summary: 'Retrieve log entries',
        security: [['sessionToken' => []]],
        tags: ['Log'],
        parameters: [
            new OA\Parameter(name: 'logDate',      in: 'query', schema: new OA\Schema(type: 'string', format: 'date'), description: 'Filter by date (YYYY-MM-DD)'),
            new OA\Parameter(name: 'logClass',     in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by log class (e.g. API)'),
            new OA\Parameter(name: 'sourceModule', in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by source module'),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of matching log entries',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/LogEntry'))),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $entries = $this->logService->search($_GET);
        $this->json(array_map(fn($e) => $e->toArray(), $entries));
    }

    /**
     * POST /api/v2/log
     *
     * @param array<string,string> $params
     */
    #[OA\Post(
        path: '/log',
        operationId: 'writeLogEntry',
        summary: 'Write a log entry',
        security: [['sessionToken' => []]],
        tags: ['Log'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/LogEntry')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Log entry created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/LogEntry'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',      content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function write(array $params): never
    {
        AuthMiddleware::requireToken();
        $data  = $this->parseJsonBody();
        $entry = $this->logService->write($data);
        $this->success($entry->toArray(), 201);
    }
}
