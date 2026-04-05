<?php
declare(strict_types=1);

namespace PiClinic\Services;

use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Visit;
use PiClinic\Repositories\PatientRepository;
use PiClinic\Repositories\VisitRepository;

class VisitService
{
    private const VALID_STATUS   = ['Open', 'Closed', 'Deleted'];
    private const VALID_POSITION = [
        'Nurse', 'NursesAid', 'NursingStudent', 'DoctorGeneral',
        'DoctorSpecialist', 'MedicalStudent', 'ClinicStaff', 'Other', 'Unassigned',
    ];
    private const MAX_VISIT_INDEX = 99;

    public function __construct(
        private PatientRepository $patientRepo,
        private VisitRepository   $visitRepo,
    ) {}

    public function getByPatientVisitID(string $patientVisitID): Visit
    {
        $row = $this->visitRepo->findByPatientVisitID($patientVisitID);
        if ($row === null) {
            throw new HttpException(404, 'Visit not found.');
        }
        return Visit::fromRow($row);
    }

    /**
     * Search visits. Requires at least one of: clinicPatientID, visitStatus.
     *
     * @param array<string,string> $params
     * @return Visit[]
     */
    public function search(array $params): array
    {
        $clinicPatientID = $params['clinicPatientID'] ?? '';
        $visitStatus     = $params['visitStatus']     ?? '';

        if ($clinicPatientID === '' && $visitStatus === '') {
            throw new HttpException(400, 'At least one query parameter is required: clinicPatientID or visitStatus.');
        }

        if ($clinicPatientID !== '') {
            $rows = $this->visitRepo->findByClinicPatientID(
                $clinicPatientID,
                $visitStatus !== '' ? $visitStatus : null
            );
        } else {
            $rows = $this->visitRepo->findByStatus($visitStatus);
        }

        return array_map(fn(array $r) => Visit::fromRow($r), $rows);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Visit
    {
        // Validate required fields
        if (empty($data['clinicPatientID'])) {
            throw new HttpException(400, 'Required field missing: clinicPatientID.');
        }
        if (empty($data['visitType'])) {
            throw new HttpException(400, 'Required field missing: visitType.');
        }

        if (isset($data['staffPosition']) && $data['staffPosition'] !== '' &&
            !in_array($data['staffPosition'], self::VALID_POSITION, true)) {
            throw new HttpException(400, 'Invalid value for staffPosition.');
        }

        // Look up the patient (raw row to get internal patientID)
        $patient = $this->patientRepo->findRawByClinicPatientID($data['clinicPatientID']);
        if ($patient === null) {
            throw new HttpException(404, 'Patient not found: ' . $data['clinicPatientID']);
        }

        // Determine dateTimeIn
        $dateTimeIn = null;
        if (!empty($data['dateTimeIn'])) {
            $dt = date_create_from_format('Y-m-d H:i:s', $data['dateTimeIn']);
            if ($dt !== false) {
                $dateTimeIn = $dt;
            }
        }
        if ($dateTimeIn === null) {
            $dateTimeIn = date_create_from_format('Y-m-d H:i:s', date('Y-m-d H:i:s'));
        }

        $visitDate    = $dateTimeIn->format('Y-m-d');
        $dateTimeStr  = $dateTimeIn->format('Y-m-d H:i:s');

        // Compute next visit index for this patient on this date
        $maxIndex = $this->visitRepo->getMaxVisitIndex($data['clinicPatientID'], $visitDate);
        $nextIndex = $maxIndex + 1;
        if ($nextIndex > self::MAX_VISIT_INDEX) {
            throw new HttpException(500, 'Patient has exceeded the maximum number of visits per day.');
        }

        // Build patientVisitID: zero-padded patientID (12) + YYYYMMDD (8) + index (2)
        $patientVisitID = sprintf(
            '%012d%s%02d',
            (int) $patient['patientID'],
            $dateTimeIn->format('Ymd'),
            $nextIndex
        );

        // Build the full insert row
        $lastName = trim((string) ($patient['lastName'] ?? ''));
        if (!empty($patient['lastName2'])) {
            $lastName .= ' ' . trim((string) $patient['lastName2']);
        }

        $row = [
            'patientVisitID'           => $patientVisitID,
            'patientID'                => $patient['patientID'],
            'clinicPatientID'          => $data['clinicPatientID'],
            'patientNationalID'        => $patient['patientNationalID'] ?? null,
            'patientFamilyID'          => $patient['familyID']          ?? null,
            'visitType'                => trim($data['visitType']),
            'visitStatus'              => 'Open',
            'dateTimeIn'               => $dateTimeStr,
            'staffUsername'            => $data['staffUsername']         ?? null,
            'staffName'                => $data['staffName']             ?? null,
            'staffPosition'            => $data['staffPosition']         ?? null,
            'firstVisit'               => 'NO',
            'patientLastName'          => $lastName,
            'patientFirstName'         => trim((string) ($patient['firstName']          ?? '')),
            'patientSex'               => (string) ($patient['sex']                    ?? ''),
            'patientBirthDate'         => $patient['birthDate']          ?? null,
            'patientHomeAddress1'      => $patient['homeAddress1']       ?? null,
            'patientHomeAddress2'      => $patient['homeAddress2']       ?? null,
            'patientHomeNeighborhood'  => $patient['homeNeighborhood']   ?? null,
            'patientHomeCity'          => $patient['homeCity']           ?? null,
            'patientHomeCounty'        => $patient['homeCounty']         ?? null,
            'patientHomeState'         => $patient['homeState']          ?? null,
            'patientContactPhone'      => $patient['contactPhone']       ?? null,
            'patientContactAltPhone'   => $patient['contactAltPhone']    ?? null,
            'patientKnownAllergies'    => $patient['knownAllergies']     ?? null,
            'patientCurrentMedications' => $patient['currentMedications'] ?? null,
            'patientNextVaccinationDate' => $patient['nextVaccinationDate'] ?? null,
            'patientResponsibleParty'  => $patient['responsibleParty']   ?? null,
            'patientMaritalStatus'     => $patient['maritalStatus']      ?? null,
            'patientProfession'        => $patient['profession']         ?? null,
        ];

        if (!$this->visitRepo->create($row)) {
            throw new HttpException(500, 'Failed to create visit record.');
        }

        $created = $this->visitRepo->findByPatientVisitID($patientVisitID);
        if ($created === null) {
            throw new HttpException(500, 'Visit created but could not be retrieved.');
        }
        return Visit::fromRow($created);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(string $patientVisitID, array $data): Visit
    {
        $existing = $this->visitRepo->findByPatientVisitID($patientVisitID);
        if ($existing === null) {
            throw new HttpException(404, 'Visit not found.');
        }

        if (isset($data['visitStatus']) && $data['visitStatus'] !== '' &&
            !in_array($data['visitStatus'], self::VALID_STATUS, true)) {
            throw new HttpException(400, 'Invalid value for visitStatus. Allowed: Open, Closed, Deleted.');
        }

        if (isset($data['staffPosition']) && $data['staffPosition'] !== '' &&
            !in_array($data['staffPosition'], self::VALID_POSITION, true)) {
            throw new HttpException(400, 'Invalid value for staffPosition.');
        }

        if (!$this->visitRepo->update($patientVisitID, $data)) {
            throw new HttpException(400, 'No updatable fields provided.');
        }

        $updated = $this->visitRepo->findByPatientVisitID($patientVisitID);
        if ($updated === null) {
            throw new HttpException(500, 'Visit updated but could not be retrieved.');
        }
        return Visit::fromRow($updated);
    }

    public function delete(string $patientVisitID): void
    {
        $existing = $this->visitRepo->findByPatientVisitID($patientVisitID);
        if ($existing === null) {
            throw new HttpException(404, 'Visit not found.');
        }

        if (!$this->visitRepo->softDelete($patientVisitID)) {
            throw new HttpException(500, 'Failed to delete visit record.');
        }
    }
}
