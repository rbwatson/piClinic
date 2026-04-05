<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

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
    public function delete(array $params): never
    {
        AuthMiddleware::requireToken();
        $this->patientService->delete($params['id']);
        $this->success(['message' => 'Patient record deactivated.']);
    }
}
