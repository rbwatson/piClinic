<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\StaffService;

class StaffController extends BaseController
{
    public function __construct(private StaffService $staffService) {}

    /**
     * GET /api/v2/staff/{username}
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/staff/{username}',
        summary: 'Get a staff member by username',
        security: [['sessionToken' => []]],
        tags: ['Staff'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'path', required: true, description: 'Staff username',
                schema: new OA\Schema(type: 'string', example: 'jsmith')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Staff member found', content: new OA\JsonContent(ref: '#/components/schemas/Staff')),
            new OA\Response(response: 401, description: 'Unauthorized',       content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',          content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function getOne(array $params): never
    {
        AuthMiddleware::requireToken();
        $staff = $this->staffService->getByUsername($params['username']);
        $this->json($staff->toArray());
    }

    /**
     * GET /api/v2/staff[?position=...&active=...]
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/staff',
        summary: 'List staff members',
        security: [['sessionToken' => []]],
        tags: ['Staff'],
        parameters: [
            new OA\Parameter(name: 'position', in: 'query',
                schema: new OA\Schema(type: 'string', enum: ['Nurse', 'NursesAid', 'NursingStudent', 'DoctorGeneral', 'DoctorSpecialist', 'MedicalStudent', 'ClinicStaff', 'Other']),
                description: 'Filter by position'),
            new OA\Parameter(name: 'active', in: 'query',
                schema: new OA\Schema(type: 'string', enum: ['0', '1', 'true', 'false']),
                description: 'Filter by active status'),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of staff',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Staff'))),
            new OA\Response(response: 400, description: 'Invalid filter value', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',         content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function list(array $params): never
    {
        AuthMiddleware::requireToken();
        $staff = $this->staffService->list($_GET);
        $this->json(array_map(fn($s) => $s->toArray(), $staff));
    }

    /**
     * POST /api/v2/staff
     * @param array<string,string> $params
     */
    #[OA\Post(
        path: '/staff',
        summary: 'Create a new staff member',
        security: [['sessionToken' => []]],
        tags: ['Staff'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['username', 'lastName', 'firstName', 'position', 'password', 'accessGranted'],
                properties: [
                    new OA\Property(property: 'username',      type: 'string', example: 'jsmith'),
                    new OA\Property(property: 'lastName',      type: 'string', example: 'Smith'),
                    new OA\Property(property: 'firstName',     type: 'string', example: 'Jane'),
                    new OA\Property(property: 'position',      type: 'string', enum: ['Nurse', 'NursesAid', 'NursingStudent', 'DoctorGeneral', 'DoctorSpecialist', 'MedicalStudent', 'ClinicStaff', 'Other']),
                    new OA\Property(property: 'password',      type: 'string', format: 'password'),
                    new OA\Property(property: 'accessGranted', type: 'string', enum: ['SystemAdmin', 'ClinicAdmin', 'ClinicStaff', 'ClinicReadOnly']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Staff member created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/Staff'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Validation error',  content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',      content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 409, description: 'Username already exists', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function create(array $params): never
    {
        AuthMiddleware::requireToken();
        $data  = $this->parseJsonBody();
        $staff = $this->staffService->create($data);
        $this->success($staff->toArray(), 201);
    }

    /**
     * PATCH /api/v2/staff/{username}
     * @param array<string,string> $params
     */
    #[OA\Patch(
        path: '/staff/{username}',
        summary: 'Update a staff member',
        security: [['sessionToken' => []]],
        tags: ['Staff'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'path', required: true, description: 'Staff username',
                schema: new OA\Schema(type: 'string', example: 'jsmith')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Staff')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Staff member updated', content: new OA\JsonContent(ref: '#/components/schemas/Staff')),
            new OA\Response(response: 400, description: 'Validation error',     content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',         content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',            content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function update(array $params): never
    {
        AuthMiddleware::requireToken();
        $data  = $this->parseJsonBody();
        $staff = $this->staffService->update($params['username'], $data);
        $this->json($staff->toArray());
    }

    /**
     * DELETE /api/v2/staff/{username}
     * @param array<string,string> $params
     */
    #[OA\Delete(
        path: '/staff/{username}',
        summary: 'Deactivate a staff member (soft delete)',
        security: [['sessionToken' => []]],
        tags: ['Staff'],
        parameters: [
            new OA\Parameter(name: 'username', in: 'path', required: true, description: 'Staff username',
                schema: new OA\Schema(type: 'string', example: 'jsmith')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Staff member deactivated', content: new OA\JsonContent(ref: '#/components/schemas/SuccessMessage')),
            new OA\Response(response: 401, description: 'Unauthorized',              content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',                 content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function delete(array $params): never
    {
        AuthMiddleware::requireToken();
        $this->staffService->delete($params['username']);
        $this->success(['message' => 'Staff member deactivated.']);
    }
}
