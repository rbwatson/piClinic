<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\PatientService;

class PatientController extends BaseController
{
    public function __construct(private PatientService $patientService) {}

    /**
     * GET /api/v2/patients/{id}
     *
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/patients/{id}',
        summary: 'Get a patient by clinic patient ID',
        security: [['sessionToken' => []]],
        tags: ['Patients'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Clinic patient ID',
                schema: new OA\Schema(type: 'string', example: 'PT-001')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Patient found',   content: new OA\JsonContent(ref: '#/components/schemas/Patient')),
            new OA\Response(response: 401, description: 'Unauthorized',    content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',       content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function getOne(array $params): never
    {
        AuthMiddleware::requireToken();
        $patient = $this->patientService->getById($params['id']);
        $this->json($patient->toArray());
    }

    /**
     * GET /api/v2/patients[?q=...&lastName=...&...]
     *
     * @param array<string,string> $params  Route params (unused for search).
     */
    #[OA\Get(
        path: '/patients',
        summary: 'Search patients',
        security: [['sessionToken' => []]],
        tags: ['Patients'],
        parameters: [
            new OA\Parameter(name: 'q',                in: 'query', schema: new OA\Schema(type: 'string'),  description: 'Free-text search across name fields'),
            new OA\Parameter(name: 'lastName',         in: 'query', schema: new OA\Schema(type: 'string'),  description: 'Filter by last name'),
            new OA\Parameter(name: 'firstName',        in: 'query', schema: new OA\Schema(type: 'string'),  description: 'Filter by first name'),
            new OA\Parameter(name: 'clinicPatientID',  in: 'query', schema: new OA\Schema(type: 'string'),  description: 'Filter by clinic patient ID'),
            new OA\Parameter(name: 'patientNationalID', in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by national ID'),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of matching patients',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Patient'))),
            new OA\Response(response: 400, description: 'No search parameters provided', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',                  content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $queryParams = $_GET;
        $patients    = $this->patientService->search($queryParams);
        $this->json(array_map(fn($p) => $p->toArray(), $patients));
    }

    /**
     * POST /api/v2/patients
     *
     * @param array<string,string> $params
     */
    #[OA\Post(
        path: '/patients',
        summary: 'Create a new patient record',
        security: [['sessionToken' => []]],
        tags: ['Patients'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Patient')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Patient created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/Patient'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Validation error',  content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',       content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 409, description: 'Patient ID already exists', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function create(array $params): never
    {
        AuthMiddleware::requireToken();
        $data    = $this->parseJsonBody();
        $patient = $this->patientService->create($data);
        $this->success($patient->toArray(), 201);
    }

    /**
     * PATCH /api/v2/patients/{id}
     *
     * @param array<string,string> $params
     */
    #[OA\Patch(
        path: '/patients/{id}',
        summary: 'Update a patient record',
        security: [['sessionToken' => []]],
        tags: ['Patients'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Clinic patient ID',
                schema: new OA\Schema(type: 'string', example: 'PT-001')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Patient')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Patient updated',   content: new OA\JsonContent(ref: '#/components/schemas/Patient')),
            new OA\Response(response: 400, description: 'Validation error',  content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',      content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',         content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function update(array $params): never
    {
        AuthMiddleware::requireToken();
        $data    = $this->parseJsonBody();
        $patient = $this->patientService->update($params['id'], $data);
        $this->json($patient->toArray());
    }

    /**
     * DELETE /api/v2/patients/{id}
     *
     * @param array<string,string> $params
     */
    #[OA\Delete(
        path: '/patients/{id}',
        summary: 'Deactivate a patient record (soft delete)',
        security: [['sessionToken' => []]],
        tags: ['Patients'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Clinic patient ID',
                schema: new OA\Schema(type: 'string', example: 'PT-001')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Patient deactivated', content: new OA\JsonContent(ref: '#/components/schemas/SuccessMessage')),
            new OA\Response(response: 401, description: 'Unauthorized',         content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, description: 'Not found',            content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function delete(array $params): never
    {
        AuthMiddleware::requireToken();
        $this->patientService->delete($params['id']);
        $this->success(['message' => 'Patient record deactivated.']);
    }
}
