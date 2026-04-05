<?php
declare(strict_types=1);

namespace PiClinic\Models;

readonly class Patient
{
    public function __construct(
        public string  $clinicPatientID,
        public ?string $patientNationalID,
        public ?string $familyID,
        public string  $lastName,
        public ?string $lastName2,
        public string  $firstName,
        public ?string $middleInitial,
        public string  $sex,
        public ?string $birthDate,
        public ?string $nextVaccinationDate,
        public ?string $homeAddress1,
        public ?string $homeAddress2,
        public ?string $homeNeighborhood,
        public ?string $homeCity,
        public ?string $homeCounty,
        public ?string $homeState,
        public ?string $contactPhone,
        public ?string $contactAltPhone,
        public ?string $bloodType,
        public ?int    $organDonor,
        public ?string $preferredLanguage,
        public ?string $knownAllergies,
        public ?string $currentMedications,
        public ?string $responsibleParty,
        public ?string $maritalStatus,
        public ?string $profession,
    ) {}

    /** @param array<string,mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            clinicPatientID:    (string) ($row['clinicPatientID']    ?? ''),
            patientNationalID:  isset($row['patientNationalID'])  ? (string) $row['patientNationalID']  : null,
            familyID:           isset($row['familyID'])           ? (string) $row['familyID']           : null,
            lastName:           (string) ($row['lastName']           ?? ''),
            lastName2:          isset($row['lastName2'])          ? (string) $row['lastName2']          : null,
            firstName:          (string) ($row['firstName']          ?? ''),
            middleInitial:      isset($row['middleInitial'])      ? (string) $row['middleInitial']      : null,
            sex:                (string) ($row['sex']                ?? ''),
            birthDate:          isset($row['birthDate'])          ? (string) $row['birthDate']          : null,
            nextVaccinationDate: isset($row['nextVaccinationDate']) ? (string) $row['nextVaccinationDate'] : null,
            homeAddress1:       isset($row['homeAddress1'])       ? (string) $row['homeAddress1']       : null,
            homeAddress2:       isset($row['homeAddress2'])       ? (string) $row['homeAddress2']       : null,
            homeNeighborhood:   isset($row['homeNeighborhood'])   ? (string) $row['homeNeighborhood']   : null,
            homeCity:           isset($row['homeCity'])           ? (string) $row['homeCity']           : null,
            homeCounty:         isset($row['homeCounty'])         ? (string) $row['homeCounty']         : null,
            homeState:          isset($row['homeState'])          ? (string) $row['homeState']          : null,
            contactPhone:       isset($row['contactPhone'])       ? (string) $row['contactPhone']       : null,
            contactAltPhone:    isset($row['contactAltPhone'])    ? (string) $row['contactAltPhone']    : null,
            bloodType:          isset($row['bloodType'])          ? (string) $row['bloodType']          : null,
            organDonor:         isset($row['organDonor'])         ? (int) $row['organDonor']            : null,
            preferredLanguage:  isset($row['preferredLanguage'])  ? (string) $row['preferredLanguage']  : null,
            knownAllergies:     isset($row['knownAllergies'])     ? (string) $row['knownAllergies']     : null,
            currentMedications: isset($row['currentMedications']) ? (string) $row['currentMedications'] : null,
            responsibleParty:   isset($row['responsibleParty'])   ? (string) $row['responsibleParty']   : null,
            maritalStatus:      isset($row['maritalStatus'])      ? (string) $row['maritalStatus']      : null,
            profession:         isset($row['profession'])         ? (string) $row['profession']         : null,
        );
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'clinicPatientID'    => $this->clinicPatientID,
            'patientNationalID'  => $this->patientNationalID,
            'familyID'           => $this->familyID,
            'lastName'           => $this->lastName,
            'lastName2'          => $this->lastName2,
            'firstName'          => $this->firstName,
            'middleInitial'      => $this->middleInitial,
            'sex'                => $this->sex,
            'birthDate'          => $this->birthDate,
            'nextVaccinationDate' => $this->nextVaccinationDate,
            'homeAddress1'       => $this->homeAddress1,
            'homeAddress2'       => $this->homeAddress2,
            'homeNeighborhood'   => $this->homeNeighborhood,
            'homeCity'           => $this->homeCity,
            'homeCounty'         => $this->homeCounty,
            'homeState'          => $this->homeState,
            'contactPhone'       => $this->contactPhone,
            'contactAltPhone'    => $this->contactAltPhone,
            'bloodType'          => $this->bloodType,
            'organDonor'         => $this->organDonor,
            'preferredLanguage'  => $this->preferredLanguage,
            'knownAllergies'     => $this->knownAllergies,
            'currentMedications' => $this->currentMedications,
            'responsibleParty'   => $this->responsibleParty,
            'maritalStatus'      => $this->maritalStatus,
            'profession'         => $this->profession,
        ];
    }
}
