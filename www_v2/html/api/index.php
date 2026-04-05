<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use PiClinic\Controllers\AuthController;
use PiClinic\Controllers\ClinicController;
use PiClinic\Controllers\IcdController;
use PiClinic\Controllers\PatientController;
use PiClinic\Controllers\StaffController;
use PiClinic\Controllers\VisitController;
use PiClinic\Middleware\CorsMiddleware;
use PiClinic\Middleware\LoggerMiddleware;
use PiClinic\Repositories\ClinicRepository;
use PiClinic\Repositories\IcdRepository;
use PiClinic\Repositories\PatientRepository;
use PiClinic\Repositories\SessionRepository;
use PiClinic\Repositories\StaffRepository;
use PiClinic\Repositories\VisitRepository;
use PiClinic\Services\AuthService;
use PiClinic\Services\ClinicService;
use PiClinic\Services\IcdService;
use PiClinic\Services\PatientService;
use PiClinic\Services\StaffService;
use PiClinic\Services\VisitService;

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// ---------------------------------------------------------------------------
// Global exception handler — always return JSON, never HTML
// ---------------------------------------------------------------------------
set_exception_handler(function (Throwable $e): never {
    $statusCode = ($e instanceof \PiClinic\Exceptions\HttpException)
        ? $e->getStatusCode()
        : 500;

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $body = ['status' => 'error', 'message' => $e->getMessage()];

    if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
        $body['trace'] = $e->getTraceAsString();
    }

    echo json_encode($body);
    exit;
});

// ---------------------------------------------------------------------------
// CORS (handles OPTIONS preflight and sets headers on all responses)
// ---------------------------------------------------------------------------
(new CorsMiddleware())->handle();

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------
$logger = LoggerMiddleware::getLogger();
$logger->info('Request', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'uri'    => $_SERVER['REQUEST_URI'] ?? '',
    'ip'     => $_SERVER['REMOTE_ADDR'] ?? '',
]);

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

// Strip the base path so controllers see only the resource path.
// e.g. /api/v2/patients/123 -> /patients/123
$basePath = '/api/v2';
$path = str_starts_with($uri, $basePath)
    ? substr($uri, strlen($basePath))
    : $uri;
$path = '/' . trim($path, '/');

// ---------------------------------------------------------------------------
// Route table
// Each entry: [HTTP_METHOD, regex_pattern, callable_handler]
// Named capture groups become the $params array passed to the handler.
// Use '*' as method to match all HTTP methods.
//
// Routes are registered here as sub-phases are implemented:
//   Phase 1B: /auth/login  /auth/logout  /auth/session  /auth/refresh  ✓
//   Phase 1C: /patients    /patients/{id}
//   Phase 1D: /visits      /visits/{id}
//   Phase 1E: /staff       /clinic       /icd
// ---------------------------------------------------------------------------

// Shared repository instances
$staffRepo   = new StaffRepository();
$patientRepo = new PatientRepository();

// Phase 1B: Auth
$auth = new AuthController(
    new AuthService(new SessionRepository(), $staffRepo)
);

// Phase 1C: Patients
$patient = new PatientController(new PatientService($patientRepo));

// Phase 1D: Visits
$visit = new VisitController(new VisitService($patientRepo, new VisitRepository()));

// Phase 1E: Supporting APIs
$staff  = new StaffController(new StaffService($staffRepo));
$clinic = new ClinicController(new ClinicService(new ClinicRepository()));
$icd    = new IcdController(new IcdService(new IcdRepository()));

$routes = [
    // Auth
    ['POST', '/auth/login',   [$auth, 'login']],
    ['GET',  '/auth/session', [$auth, 'session']],
    ['POST', '/auth/logout',  [$auth, 'logout']],
    ['POST', '/auth/refresh', [$auth, 'refresh']],

    // Patients
    ['GET',    '/patients',                  [$patient, 'search']],
    ['POST',   '/patients',                  [$patient, 'create']],
    ['GET',    '/patients/(?P<id>[^/]+)',    [$patient, 'getOne']],
    ['PATCH',  '/patients/(?P<id>[^/]+)',    [$patient, 'update']],
    ['DELETE', '/patients/(?P<id>[^/]+)',    [$patient, 'delete']],

    // Visits
    ['GET',    '/visits',                                    [$visit, 'search']],
    ['POST',   '/visits',                                    [$visit, 'create']],
    ['GET',    '/visits/(?P<id>[^/]+)',                      [$visit, 'getOne']],
    ['PATCH',  '/visits/(?P<id>[^/]+)',                      [$visit, 'update']],
    ['DELETE', '/visits/(?P<id>[^/]+)',                      [$visit, 'delete']],

    // Staff
    ['GET',    '/staff',                                     [$staff, 'list']],
    ['POST',   '/staff',                                     [$staff, 'create']],
    ['GET',    '/staff/(?P<username>[^/]+)',                  [$staff, 'getOne']],
    ['PATCH',  '/staff/(?P<username>[^/]+)',                  [$staff, 'update']],
    ['DELETE', '/staff/(?P<username>[^/]+)',                  [$staff, 'delete']],

    // Clinic (read-only)
    ['GET',    '/clinic',                                    [$clinic, 'search']],

    // ICD-10 (read-only)
    ['GET',    '/icd',                                       [$icd, 'search']],
    ['GET',    '/icd/(?P<code>[^/]+)',                       [$icd, 'getOne']],
];

// Dispatch
foreach ($routes as [$routeMethod, $pattern, $handler]) {
    if ($routeMethod !== '*' && $routeMethod !== $method) {
        continue;
    }
    if (preg_match('#^' . $pattern . '$#', $path, $matches)) {
        $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        $handler($params);
        exit;
    }
}

// No route matched
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status'  => 'error',
    'message' => 'Endpoint not found',
    'path'    => $path,
]);
