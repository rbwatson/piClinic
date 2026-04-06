<?php
declare(strict_types=1);

namespace PiClinic\Controllers;

use OpenApi\Attributes as OA;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Services\CommentService;

class CommentController extends BaseController
{
    public function __construct(private CommentService $commentService) {}

    /**
     * GET /api/v2/comments
     *
     * @param array<string,string> $params
     */
    #[OA\Get(
        path: '/comments',
        operationId: 'searchComments',
        summary: 'Search comments',
        security: [['sessionToken' => []]],
        tags: ['Comments'],
        parameters: [
            new OA\Parameter(name: 'username',     in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by username'),
            new OA\Parameter(name: 'commentDate',  in: 'query', schema: new OA\Schema(type: 'string', format: 'date'), description: 'Filter by comment date (YYYY-MM-DD)'),
            new OA\Parameter(name: 'referringPage', in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by referring page name'),
            new OA\Parameter(name: 'referringUrl', in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by referring URL'),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of matching comments',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Comment'))),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function search(array $params): never
    {
        AuthMiddleware::requireToken();
        $comments = $this->commentService->search($_GET);
        $this->json(array_map(fn($c) => $c->toArray(), $comments));
    }

    /**
     * POST /api/v2/comments
     *
     * @param array<string,string> $params
     */
    #[OA\Post(
        path: '/comments',
        operationId: 'createComment',
        summary: 'Submit a new comment',
        security: [['sessionToken' => []]],
        tags: ['Comments'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Comment')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Comment created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data',   ref: '#/components/schemas/Comment'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 401, description: 'Unauthorized',      content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ]
    )]
    public function create(array $params): never
    {
        AuthMiddleware::requireToken();
        $data    = $this->parseJsonBody();
        $comment = $this->commentService->create($data);
        $this->success($comment->toArray(), 201);
    }
}
