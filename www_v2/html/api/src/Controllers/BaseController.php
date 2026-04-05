<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

/**
 * Base class for all v2 API controllers.
 *
 * Provides JSON response helpers. All response methods terminate the request
 * by calling exit after sending output.
 */
abstract class BaseController
{
    /**
     * Send a raw JSON response.
     *
     * @param mixed $data       Anything JSON-serializable.
     * @param int   $statusCode HTTP status code.
     */
    protected function json(mixed $data, int $statusCode = 200): never
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send a successful response with a data payload.
     *
     * @param mixed $data       The response data.
     * @param int   $statusCode Defaults to 200; use 201 for created resources.
     */
    protected function success(mixed $data, int $statusCode = 200): never
    {
        $this->json(['status' => 'success', 'data' => $data], $statusCode);
    }

    /**
     * Send an error response.
     *
     * @param string       $message    Human-readable error description.
     * @param int          $statusCode HTTP status code.
     * @param array<string,string[]>|null $errors Field-level validation errors.
     */
    protected function error(
        string $message,
        int $statusCode = 400,
        ?array $errors = null
    ): never {
        $body = ['status' => 'error', 'message' => $message];
        if ($errors !== null) {
            $body['errors'] = $errors;
        }
        $this->json($body, $statusCode);
    }

    protected function notFound(string $message = 'Resource not found'): never
    {
        $this->error($message, 404);
    }

    protected function unauthorized(string $message = 'Unauthorized'): never
    {
        $this->error($message, 401);
    }

    protected function forbidden(string $message = 'Forbidden'): never
    {
        $this->error($message, 403);
    }
}
