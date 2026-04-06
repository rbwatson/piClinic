<?php
declare(strict_types=1);

namespace PiClinic\Services;

use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Comment;
use PiClinic\Repositories\CommentRepository;

class CommentService
{
    public function __construct(private CommentRepository $repo) {}

    /**
     * @param array<string,string> $params  Query-string params from the request.
     * @return Comment[]
     */
    public function search(array $params): array
    {
        $rows = $this->repo->search($params);
        return array_map(fn(array $r) => Comment::fromRow($r), $rows);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Comment
    {
        $data = $this->trimStrings($data);

        if (empty($data['username'])) {
            throw new HttpException(400, 'Required field missing: username.');
        }

        $newId = $this->repo->create($data);
        $row   = $this->repo->findById($newId);
        if ($row === null) {
            throw new HttpException(500, 'Comment created but could not be retrieved.');
        }
        return Comment::fromRow($row);
    }

    /**
     * @param array<string,mixed> $data
     * @return array<string,mixed>
     */
    private function trimStrings(array $data): array
    {
        $stringFields = ['username', 'referringUrl', 'referringPage', 'returnUrl', 'commentText'];
        foreach ($stringFields as $f) {
            if (isset($data[$f]) && is_string($data[$f])) {
                $data[$f] = trim($data[$f]);
            }
        }
        return $data;
    }
}
