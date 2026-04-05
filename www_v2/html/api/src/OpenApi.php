<?php
declare(strict_types=1);

namespace PiClinic;

use OpenApi\Attributes as OA;

/**
 * Top-level OpenAPI definition for the piClinic v2 API.
 * swagger-php scans this file for the @OA\Info, @OA\Server, and
 * @OA\SecurityScheme blocks; endpoint and schema annotations live in
 * the relevant controller and model files.
 */
#[OA\Info(
    version: '2.0.0',
    title: 'piClinic API',
    description: 'REST API for the piClinic clinic information system (v2.0). ' .
                 'All endpoints except POST /auth/login require a valid session token ' .
                 'supplied via the X-Session-Token header or the piclinic_session cookie.',
    license: new OA\License(name: 'MIT'),
)]
#[OA\Server(url: '/api/v2', description: 'piClinic v2 API')]
#[OA\SecurityScheme(
    securityScheme: 'sessionToken',
    type: 'apiKey',
    in: 'header',
    name: 'X-Session-Token',
    description: 'Session token obtained from POST /auth/login.',
)]
#[OA\Schema(
    schema: 'Error',
    required: ['status', 'message'],
    properties: [
        new OA\Property(property: 'status',  type: 'string', example: 'error'),
        new OA\Property(property: 'message', type: 'string', example: 'Resource not found'),
    ]
)]
#[OA\Schema(
    schema: 'SuccessMessage',
    required: ['status', 'data'],
    properties: [
        new OA\Property(property: 'status', type: 'string', example: 'success'),
        new OA\Property(property: 'data',   type: 'object',
            properties: [
                new OA\Property(property: 'message', type: 'string'),
            ]
        ),
    ]
)]
class OpenApi {}
