<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\IcdService;

class IcdController extends BaseController
{
    public function __construct(private IcdService $icdService) {}

    /**
     * GET /api/v2/icd[?q=...&t=...&c=...&language=...&sort=...]
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/icd',
        summary: 'Search ICD-10 codes',
        security: [['sessionToken' => []]],
        tags: ['ICD'],
        parameters: [
            new OA\Parameter(name: 'q',        in: 'query', description: 'Search code or description text',     schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 't',        in: 'query', description: 'Search description text only',        schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'c',        in: 'query', description: 'Search by code prefix',               schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'language', in: 'query', description: 'Language for descriptions (default en)',
                schema: new OA\Schema(type: 'string', enum: ['en', 'es'], default: 'en')),
            new OA\Parameter(name: 'sort', in: 'query', description: 'Sort field: c=code, t=description, d=last used date',
                schema: new OA\Schema(type: 'string', enum: ['c', 't', 'd'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of matching ICD-10 codes',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/IcdCode'))),
            new OA\Response(response: 400, description: 'No search parameter provided', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',                 content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $codes = $this->icdService->search($_GET);
        $this->json(array_map(fn($code) => $code->toArray(), $codes));
    }

    /**
     * GET /api/v2/icd/{code}[?language=en]
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/icd/{code}',
        summary: 'Get a single ICD-10 code',
        security: [['sessionToken' => []]],
        tags: ['ICD'],
        parameters: [
            new OA\Parameter(name: 'code', in: 'path', required: true, description: 'ICD-10 code (e.g. J06.9)',
                schema: new OA\Schema(type: 'string', example: 'J06.9')),
            new OA\Parameter(name: 'language', in: 'query', description: 'Language for description (default en)',
                schema: new OA\Schema(type: 'string', enum: ['en', 'es'], default: 'en')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'ICD-10 code found', content: new OA\JsonContent(ref: '#/components/schemas/IcdCode')),
            new OA\Response(response: 401, description: 'Unauthorized',      content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',         content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function getOne(array $params): never
    {
        AuthMiddleware::requireToken();
        $language = $_GET['language'] ?? 'en';
        $code     = $this->icdService->getByCode($params['code'], $language);
        $this->json($code->toArray());
    }
}
