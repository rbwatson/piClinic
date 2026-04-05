<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\IcdService;

class IcdController extends BaseController
{
    public function __construct(private IcdService $icdService) {}

    /** GET /api/v2/icd[?q=...&t=...&c=...&language=...&sort=...] */
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $codes = $this->icdService->search($_GET);
        $this->json(array_map(fn($code) => $code->toArray(), $codes));
    }

    /** GET /api/v2/icd/{code}[?language=en] */
    public function getOne(array $params): never
    {
        AuthMiddleware::requireToken();
        $language = $_GET['language'] ?? 'en';
        $code     = $this->icdService->getByCode($params['code'], $language);
        $this->json($code->toArray());
    }
}
