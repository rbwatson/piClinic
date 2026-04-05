<?php
declare(strict_types=1);

namespace PiClinic\Models;

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
