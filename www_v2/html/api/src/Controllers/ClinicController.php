<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\ClinicService;

class ClinicController extends BaseController
{
    public function __construct(private ClinicService $clinicService) {}

    /**
     * GET /api/v2/clinic[?thisClinic=1|publicID=...|shortName=...]
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/clinic',
        operationId: 'searchClinics',
        summary: 'Search for clinic records',
        security: [['sessionToken' => []]],
        tags: ['Clinic'],
        parameters: [
            new OA\Parameter(name: 'thisClinic', in: 'query', description: 'Return the local clinic record (value: 1)',
                schema: new OA\Schema(type: 'string', enum: ['1'])),
            new OA\Parameter(name: 'publicID',   in: 'query', description: 'Filter by public ID',
                schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'shortName',  in: 'query', description: 'Filter by short name',
                schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of matching clinics',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Clinic'))),
            new OA\Response(response: 400, description: 'No valid search parameter provided', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $clinics = $this->clinicService->search($_GET);
        $this->json(array_map(fn($c) => $c->toArray(), $clinics));
    }
}
