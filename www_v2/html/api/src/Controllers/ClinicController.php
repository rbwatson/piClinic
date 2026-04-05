<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\ClinicService;

class ClinicController extends BaseController
{
    public function __construct(private ClinicService $clinicService) {}

    /** GET /api/v2/clinic[?thisClinic=1|publicID=...|shortName=...] */
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $clinics = $this->clinicService->search($_GET);
        $this->json(array_map(fn($c) => $c->toArray(), $clinics));
    }
}
