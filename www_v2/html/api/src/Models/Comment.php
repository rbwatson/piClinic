<?php
declare(strict_types=1);

namespace PiClinic\Models;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Comment',
    required: ['username'],
    properties: [
        new OA\Property(property: 'commentID',    type: 'integer', readOnly: true, nullable: true, example: 1),
        new OA\Property(property: 'commentDate',  type: 'string',  format: 'date-time', nullable: true, example: '2026-04-06T10:30:00'),
        new OA\Property(property: 'username',     type: 'string',  example: 'jsmith'),
        new OA\Property(property: 'referringUrl', type: 'string',  nullable: true),
        new OA\Property(property: 'referringPage', type: 'string', nullable: true),
        new OA\Property(property: 'returnUrl',    type: 'string',  nullable: true),
        new OA\Property(property: 'commentText',  type: 'string',  nullable: true),
        new OA\Property(property: 'createdDate',  type: 'string',  format: 'date-time', readOnly: true, nullable: true),
    ]
)]
readonly class Comment
{
    public function __construct(
        public ?int    $commentID,
        public ?string $commentDate,
        public string  $username,
        public ?string $referringUrl,
        public ?string $referringPage,
        public ?string $returnUrl,
        public ?string $commentText,
        public ?string $createdDate,
    ) {}

    /** @param array<string,mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            commentID:    isset($row['commentID'])    ? (int)    $row['commentID']    : null,
            commentDate:  isset($row['commentDate'])  ? (string) $row['commentDate']  : null,
            username:     (string) ($row['username']  ?? ''),
            referringUrl: isset($row['referringUrl']) ? (string) $row['referringUrl'] : null,
            referringPage: isset($row['referringPage']) ? (string) $row['referringPage'] : null,
            returnUrl:    isset($row['returnUrl'])    ? (string) $row['returnUrl']    : null,
            commentText:  isset($row['commentText'])  ? (string) $row['commentText']  : null,
            createdDate:  isset($row['createdDate'])  ? (string) $row['createdDate']  : null,
        );
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'commentID'    => $this->commentID,
            'commentDate'  => $this->commentDate,
            'username'     => $this->username,
            'referringUrl' => $this->referringUrl,
            'referringPage' => $this->referringPage,
            'returnUrl'    => $this->returnUrl,
            'commentText'  => $this->commentText,
            'createdDate'  => $this->createdDate,
        ];
    }
}
