<?php
declare(strict_types=1);

namespace PiClinic\Services;

use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Patient;
use PiClinic\Repositories\PatientRepository;

class PatientService
{
    private const VALID_SEX        = ['M', 'F', 'X'];
    private const VALID_BLOOD_TYPE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'NA'];
    private const VALID_MARITAL    = [
        'Single', 'Married', 'LivingTogether', 'Engaged',
        'Divorced', 'Separated', 'Widowed', 'Other',
    ];

    public function __construct(private PatientRepository $repo) {}

    public function getById(string $clinicPatientID): Patient
    {
        $row = $this->repo->findById($clinicPatientID);
        if ($row === null) {
            throw new HttpException(404, 'Patient not found.');
        }
        return Patient::fromRow($row);
    }

    /**
     * @param array<string,string> $params  Query-string params from the request.
     * @return Patient[]
     */
    public function search(array $params): array
    {
        if (empty($params)) {
            throw new HttpException(400, 'At least one search parameter is required.');
        }

        if (!empty($params['q'])) {
            $rows = $this->repo->search($params['q']);
        } else {
            $rows = $this->repo->searchByFields($params);
        }
        return array_map(fn(array $r) => Patient::fromRow($r), $rows);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Patient
    {
        $data = $this->trimStrings($data);
        $this->requireFields($data, ['clinicPatientID', 'lastName', 'firstName', 'sex']);
        $this->validateEnums($data);

        if ($this->repo->existsByClinicPatientID($data['clinicPatientID'])) {
            throw new HttpException(409, 'A patient with that clinic ID already exists.');
        }

        if (!$this->repo->create($data)) {
            throw new HttpException(500, 'Failed to create patient record.');
        }

        $row = $this->repo->findById($data['clinicPatientID']);
        if ($row === null) {
            throw new HttpException(500, 'Patient created but could not be retrieved.');
        }
        return Patient::fromRow($row);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(string $clinicPatientID, array $data): Patient
    {
        // Confirm the patient exists (active only — view filters inactive rows).
        $existing = $this->repo->findById($clinicPatientID);
        if ($existing === null) {
            throw new HttpException(404, 'Patient not found.');
        }

        $data = $this->trimStrings($data);
        $this->validateEnums($data);

        if (!$this->repo->update($clinicPatientID, $data)) {
            throw new HttpException(400, 'No updatable fields provided.');
        }

        $row = $this->repo->findById($clinicPatientID);
        if ($row === null) {
            throw new HttpException(500, 'Patient updated but could not be retrieved.');
        }
        return Patient::fromRow($row);
    }

    public function delete(string $clinicPatientID): void
    {
        $existing = $this->repo->findById($clinicPatientID);
        if ($existing === null) {
            throw new HttpException(404, 'Patient not found.');
        }

        if (!$this->repo->deactivate($clinicPatientID)) {
            throw new HttpException(500, 'Failed to deactivate patient record.');
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * @param array<string,mixed> $data
     * @param string[]            $fields
     */
    private function requireFields(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (empty($data[$field])) {
                throw new HttpException(400, "Required field missing: {$field}.");
            }
        }
    }

    /** @param array<string,mixed> $data */
    private function validateEnums(array $data): void
    {
        if (isset($data['sex']) && $data['sex'] !== '' &&
            !in_array($data['sex'], self::VALID_SEX, true)) {
            throw new HttpException(400, 'Invalid value for sex. Allowed: M, F, X.');
        }

        if (isset($data['bloodType']) && $data['bloodType'] !== '' &&
            !in_array($data['bloodType'], self::VALID_BLOOD_TYPE, true)) {
            throw new HttpException(400, 'Invalid value for bloodType.');
        }

        if (isset($data['maritalStatus']) && $data['maritalStatus'] !== '' &&
            !in_array($data['maritalStatus'], self::VALID_MARITAL, true)) {
            throw new HttpException(400, 'Invalid value for maritalStatus.');
        }
    }

    /**
     * Trim leading/trailing whitespace from all string fields.
     *
     * @param array<string,mixed> $data
     * @return array<string,mixed>
     */
    private function trimStrings(array $data): array
    {
        $stringFields = [
            'clinicPatientID', 'patientNationalID', 'familyID',
            'lastName', 'lastName2', 'firstName', 'middleInitial',
            'preferredLanguage', 'homeAddress1', 'homeAddress2',
            'homeNeighborhood', 'homeCity', 'homeCounty', 'homeState',
            'contactPhone', 'contactAltPhone', 'knownAllergies',
            'currentMedications', 'responsibleParty', 'maritalStatus', 'profession',
        ];
        foreach ($stringFields as $f) {
            if (isset($data[$f]) && is_string($data[$f])) {
                $data[$f] = trim($data[$f]);
            }
        }
        return $data;
    }
}
