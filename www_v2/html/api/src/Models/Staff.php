<?php
declare(strict_types=1);

namespace PiClinic\Models;

use OpenApi\Attributes as OA;

/**
 * Staff member — password is never included.
 */
#[OA\Schema(
    schema: 'Staff',
    required: ['username', 'lastName', 'firstName', 'position', 'medicalStaff', 'active', 'accessGranted'],
    properties: [
        new OA\Property(property: 'memberID',               type: 'string',  nullable: true),
        new OA\Property(property: 'username',               type: 'string',  example: 'jsmith'),
        new OA\Property(property: 'lastName',               type: 'string',  example: 'Smith'),
        new OA\Property(property: 'firstName',              type: 'string',  example: 'Jane'),
        new OA\Property(property: 'position',               type: 'string',  enum: ['Nurse', 'NursesAid', 'NursingStudent', 'DoctorGeneral', 'DoctorSpecialist', 'MedicalStudent', 'ClinicStaff', 'Other'], example: 'Nurse'),
        new OA\Property(property: 'medicalStaff',           type: 'integer', example: 1, description: '1 if clinical position, 0 if admin/other'),
        new OA\Property(property: 'preferredLanguage',      type: 'string',  nullable: true, enum: ['en', 'es', 'ui']),
        new OA\Property(property: 'preferredClinicPublicID', type: 'string', nullable: true),
        new OA\Property(property: 'contactInfo',            type: 'string',  nullable: true),
        new OA\Property(property: 'altContactInfo',         type: 'string',  nullable: true),
        new OA\Property(property: 'active',                 type: 'integer', example: 1),
        new OA\Property(property: 'accessGranted',          type: 'string',  enum: ['SystemAdmin', 'ClinicAdmin', 'ClinicStaff', 'ClinicReadOnly'], example: 'ClinicStaff'),
        new OA\Property(property: 'lastLogin',              type: 'string',  format: 'date-time', nullable: true),
        new OA\Property(property: 'modifiedDate',           type: 'string',  format: 'date-time', nullable: true),
        new OA\Property(property: 'createdDate',            type: 'string',  format: 'date-time', nullable: true),
    ]
)]
readonly class Staff
{
    public function __construct(
        public ?string $memberID,
        public string  $username,
        public string  $lastName,
        public string  $firstName,
        public string  $position,
        public int     $medicalStaff,
        public ?string $preferredLanguage,
        public ?string $preferredClinicPublicID,
        public ?string $contactInfo,
        public ?string $altContactInfo,
        public int     $active,
        public string  $accessGranted,
        public ?string $lastLogin,
        public ?string $modifiedDate,
        public ?string $createdDate,
    ) {}

    /** @param array<string,mixed> $row */
    public static function fromRow(array $row): self
    {
        // medicalStaff may be computed by the view or calculated here.
        $position     = (string) ($row['position'] ?? '');
        $medicalStaff = (isset($row['medicalStaff']))
            ? (int) $row['medicalStaff']
            : (in_array($position, ['ClinicStaff', 'Other'], true) ? 0 : 1);

        return new self(
            memberID:               isset($row['memberID'])               ? (string) $row['memberID']               : null,
            username:               (string) ($row['username']               ?? ''),
            lastName:               (string) ($row['lastName']               ?? ''),
            firstName:              (string) ($row['firstName']              ?? ''),
            position:               $position,
            medicalStaff:           $medicalStaff,
            preferredLanguage:      isset($row['preferredLanguage'])      ? (string) $row['preferredLanguage']      : null,
            preferredClinicPublicID: isset($row['preferredClinicPublicID']) ? (string) $row['preferredClinicPublicID'] : null,
            contactInfo:            isset($row['contactInfo'])            ? (string) $row['contactInfo']            : null,
            altContactInfo:         isset($row['altContactInfo'])         ? (string) $row['altContactInfo']         : null,
            active:                 (int) ($row['active']                    ?? 1),
            accessGranted:          (string) ($row['accessGranted']          ?? 'ClinicReadOnly'),
            lastLogin:              isset($row['lastLogin'])              ? (string) $row['lastLogin']              : null,
            modifiedDate:           isset($row['modifiedDate'])           ? (string) $row['modifiedDate']           : null,
            createdDate:            isset($row['createdDate'])            ? (string) $row['createdDate']            : null,
        );
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'memberID'               => $this->memberID,
            'username'               => $this->username,
            'lastName'               => $this->lastName,
            'firstName'              => $this->firstName,
            'position'               => $this->position,
            'medicalStaff'           => $this->medicalStaff,
            'preferredLanguage'      => $this->preferredLanguage,
            'preferredClinicPublicID' => $this->preferredClinicPublicID,
            'contactInfo'            => $this->contactInfo,
            'altContactInfo'         => $this->altContactInfo,
            'active'                 => $this->active,
            'accessGranted'          => $this->accessGranted,
            'lastLogin'              => $this->lastLogin,
            'modifiedDate'           => $this->modifiedDate,
            'createdDate'            => $this->createdDate,
        ];
    }
}
