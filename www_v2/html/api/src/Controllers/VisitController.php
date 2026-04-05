<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

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
    public function delete(array $params): never
    {
        AuthMiddleware::requireToken();
        $this->visitService->delete($params['id']);
        $this->success(['message' => 'Visit record deleted.']);
    }
}
