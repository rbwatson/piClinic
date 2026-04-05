<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\StaffService;

class StaffController extends BaseController
{
    public function __construct(private StaffService $staffService) {}

    /**
     * GET /api/v2/staff/{username}
     * @param array<string,string> $params
     */
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
    public function delete(array $params): never
    {
        AuthMiddleware::requireToken();
        $this->staffService->delete($params['username']);
        $this->success(['message' => 'Staff member deactivated.']);
    }
}
