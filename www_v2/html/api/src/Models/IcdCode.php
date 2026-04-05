<?php
declare(strict_types=1);

namespace PiClinic\Models;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'IcdCode',
    required: ['language', 'icd10code', 'icd10index', 'useCount'],
    properties: [
        new OA\Property(property: 'language',         type: 'string',  enum: ['en', 'es'], example: 'en'),
        new OA\Property(property: 'icd10code',        type: 'string',  example: 'J06.9'),
        new OA\Property(property: 'icd10index',       type: 'string',  example: 'J069'),
        new OA\Property(property: 'shortDescription', type: 'string',  nullable: true, example: 'Acute upper respiratory infection, unspecified'),
        new OA\Property(property: 'useCount',         type: 'integer', example: 12),
        new OA\Property(property: 'lastUsedDate',     type: 'string',  format: 'date', nullable: true, example: '2026-04-01'),
    ]
)]
readonly class IcdCode
{
    public function __construct(
        public string  $language,
        public string  $icd10code,
        public string  $icd10index,
        public ?string $shortDescription,
        public int     $useCount,
        public ?string $lastUsedDate,
    ) {}

    /** @param array<string,mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            language:         (string) ($row['language']         ?? ''),
            icd10code:        (string) ($row['icd10code']        ?? ''),
            icd10index:       (string) ($row['icd10index']       ?? ''),
            shortDescription: isset($row['shortDescription']) ? (string) $row['shortDescription'] : null,
            useCount:         (int)    ($row['useCount']         ?? 0),
            lastUsedDate:     isset($row['lastUsedDate'])     ? (string) $row['lastUsedDate']     : null,
        );
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'language'         => $this->language,
            'icd10code'        => $this->icd10code,
            'icd10index'       => $this->icd10index,
            'shortDescription' => $this->shortDescription,
            'useCount'         => $this->useCount,
            'lastUsedDate'     => $this->lastUsedDate,
        ];
    }
}
