<?php
declare(strict_types=1);

namespace PiClinic\Models;

/**
 * Staff member — password is never included.
 */
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
