<?php
declare(strict_types=1);

namespace PiClinic\Models;

use OpenApi\Attributes as OA;

/**
 * Immutable value object representing the session data returned to clients.
 *
 * Only the fields safe to expose are included here; the full session row
 * (sessionIP, sessionUA, etc.) is handled internally by the repository.
 */
#[OA\Schema(
    schema: 'Session',
    required: ['token', 'username', 'accessGranted', 'sessionLanguage', 'expiresOnDate'],
    properties: [
        new OA\Property(property: 'token',                 type: 'string',  example: 'abc123def456'),
        new OA\Property(property: 'username',              type: 'string',  example: 'jsmith'),
        new OA\Property(property: 'accessGranted',         type: 'string',  enum: ['SystemAdmin', 'ClinicAdmin', 'ClinicStaff', 'ClinicReadOnly'], example: 'ClinicStaff'),
        new OA\Property(property: 'sessionLanguage',       type: 'string',  enum: ['en', 'es', 'ui'], example: 'en'),
        new OA\Property(property: 'sessionClinicPublicID', type: 'string',  nullable: true, example: 'PUB001'),
        new OA\Property(property: 'expiresOnDate',         type: 'string',  format: 'date-time', example: '2026-04-06 12:00:00'),
    ]
)]
readonly class Session
{
    public function __construct(
        public string  $token,
        public string  $username,
        public string  $accessGranted,
        public string  $sessionLanguage,
        public ?string $sessionClinicPublicID,
        public string  $expiresOnDate,
    ) {}

    /** @return array<string,string|null> */
    public function toArray(): array
    {
        return [
            'token'                => $this->token,
            'username'             => $this->username,
            'accessGranted'        => $this->accessGranted,
            'sessionLanguage'      => $this->sessionLanguage,
            'sessionClinicPublicID' => $this->sessionClinicPublicID,
            'expiresOnDate'        => $this->expiresOnDate,
        ];
    }

    /** @param array<string,mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            token:                 (string) $row['token'],
            username:              (string) $row['username'],
            accessGranted:         (string) $row['accessGranted'],
            sessionLanguage:       (string) ($row['sessionLanguage'] ?? 'en'),
            sessionClinicPublicID: isset($row['sessionClinicPublicID'])
                                       ? (string) $row['sessionClinicPublicID']
                                       : null,
            expiresOnDate:         (string) $row['expiresOnDate'],
        );
    }
}
