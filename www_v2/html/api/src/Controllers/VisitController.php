<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\VisitService;

class VisitController extends BaseController
{
    public function __construct(private VisitService $visitService) {}

    /**
     * GET /api/v2/visits/{id}
     *
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/visits/{id}',
        operationId: 'getVisit',
        summary: 'Get a visit by patient visit ID',
        security: [['sessionToken' => []]],
        tags: ['Visits'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Patient visit ID (22-character composite key)',
                schema: new OA\Schema(type: 'string', example: '000000000001202604010101')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Visit found',   content: new OA\JsonContent(ref: '#/components/schemas/Visit')),
            new OA\Response(response: 401, description: 'Unauthorized',  content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',     content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function getOne(array $params): never
    {
        AuthMiddleware::requireToken();
        $visit = $this->visitService->getByPatientVisitID($params['id']);
        $this->json($visit->toArray());
    }

    /**
     * GET /api/v2/visits?clinicPatientID=...&visitStatus=...
     *
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/visits',
        operationId: 'searchVisits',
        summary: 'Search visits by patient or status',
        security: [['sessionToken' => []]],
        tags: ['Visits'],
        parameters: [
            new OA\Parameter(name: 'clinicPatientID', in: 'query', required: true, description: 'Clinic patient ID',
                schema: new OA\Schema(type: 'string', example: 'PT-001')),
            new OA\Parameter(name: 'visitStatus', in: 'query', description: 'Filter by visit status',
                schema: new OA\Schema(type: 'string', enum: ['Open', 'Closed', 'Deleted'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of visits',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Visit'))),
            new OA\Response(response: 400, description: 'clinicPatientID is required', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',                content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $visits = $this->visitService->search($_GET);
        $this->json(array_map(fn($v) => $v->toArray(), $visits));
    }

    /**
     * POST /api/v2/visits
     *
     * @param array<string,string> $params
     */
    #[OA\Post(
        path: '/visits',
        operationId: 'createVisit',
        summary: 'Open a new visit',
        security: [['sessionToken' => []]],
        tags: ['Visits'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['clinicPatientID', 'visitType'],
                properties: [
                    new OA\Property(property: 'clinicPatientID', type: 'string', example: 'PT-001'),
                    new OA\Property(property: 'visitType',       type: 'string', example: 'Clinic'),
                    new OA\Property(property: 'dateTimeIn',      type: 'string', format: 'date-time'),
                    new OA\Property(property: 'staffUsername',   type: 'string', example: 'jsmith'),
                    new OA\Property(property: 'primaryComplaint', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Visit opened',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/Visit'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',     content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Patient not found', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function create(array $params): never
    {
        AuthMiddleware::requireToken();
        $data  = $this->parseJsonBody();
        $visit = $this->visitService->create($data);
        $this->success($visit->toArray(), 201);
    }

    /**
     * PATCH /api/v2/visits/{id}
     *
     * @param array<string,string> $params
     */
    #[OA\Patch(
        path: '/visits/{id}',
        operationId: 'updateVisit',
        summary: 'Update a visit record',
        security: [['sessionToken' => []]],
        tags: ['Visits'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Patient visit ID',
                schema: new OA\Schema(type: 'string', example: '000000000001202604010101')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Visit')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Visit updated',    content: new OA\JsonContent(ref: '#/components/schemas/Visit')),
            new OA\Response(response: 400, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',     content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',        content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function update(array $params): never
    {
        AuthMiddleware::requireToken();
        $data  = $this->parseJsonBody();
        $visit = $this->visitService->update($params['id'], $data);
        $this->json($visit->toArray());
    }

    /**
     * DELETE /api/v2/visits/{id}
     *
     * @param array<string,string> $params
     */
    #[OA\Delete(
        path: '/visits/{id}',
        operationId: 'deleteVisit',
        summary: 'Soft-delete a visit record',
        security: [['sessionToken' => []]],
        tags: ['Visits'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Patient visit ID',
                schema: new OA\Schema(type: 'string', example: '000000000001202604010101')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Visit deleted',  content: new OA\JsonContent(ref: '#/components/schemas/SuccessMessage')),
            new OA\Response(response: 401, description: 'Unauthorized',   content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',      content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function delete(array $params): never
    {
        AuthMiddleware::requireToken();
        $this->visitService->delete($params['id']);
        $this->success(['message' => 'Visit record deleted.']);
    }
}
