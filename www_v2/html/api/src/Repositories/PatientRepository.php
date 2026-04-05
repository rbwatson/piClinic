<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

class PatientRepository extends BaseRepository
{
    private const VIEW  = 'patientGet';
    private const TABLE = 'patient';

    /** @return array<string,mixed>|null */
    public function findById(string $clinicPatientID): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::VIEW . '` WHERE `clinicPatientID` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $clinicPatientID);
        $stmt->execute();
        $result = $stmt->get_result();
        $row    = $result->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * Free-text search: splits on whitespace, matches any term against
     * name / ID / location columns — mirrors v1 makePatientSearchQuery().
     *
     * @return array<int,array<string,mixed>>
     */
    public function search(string $q): array
    {
        $terms = array_slice(explode(' ', trim($q)), 0, 5);
        // Always include the full string as an extra term when multi-word.
        if (count($terms) > 1) {
            $terms[] = $q;
        }

        $clauses = [];
        $binds   = [];
        $types   = '';

        foreach ($terms as $term) {
            $exact  = $term;
            $like   = '%' . $term . '%';
            $prefix = $term . '%';

            $clauses[] = '(`clinicPatientID` = ? OR `familyID` = ?' .
                         ' OR `lastName` LIKE ? OR `lastName2` LIKE ?' .
                         ' OR `firstName` LIKE ? OR `middleInitial` LIKE ?' .
                         ' OR `homeNeighborhood` LIKE ? OR `homeCity` LIKE ?' .
                         ' OR `homeCounty` LIKE ? OR `homeState` LIKE ?)';

            array_push($binds, $exact, $exact, $like, $like, $like, $like,
                                $prefix, $prefix, $prefix, $prefix);
            $types .= 'ssssssssss';
        }

        $sql  = 'SELECT * FROM `' . self::VIEW . '` WHERE ' .
                implode(' OR ', $clauses) .
                ' ORDER BY `lastName` LIMIT ' . $this->queryLimit();
        $stmt = $this->prepare($sql);
        $stmt->bind_param($types, ...$binds);
        $stmt->execute();
        $result = $stmt->get_result();
        $rows   = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * Structured field search — each provided param ANDed together.
     *
     * @param array<string,string> $fields
     * @return array<int,array<string,mixed>>
     */
    public function searchByFields(array $fields): array
    {
        $allowed = [
            'clinicPatientID', 'familyID', 'lastName', 'lastName2',
            'firstName', 'middleInitial', 'sex', 'birthDate',
            'homeNeighborhood', 'homeCity', 'homeCounty', 'homeState',
        ];

        $conditions = [];
        $binds      = [];
        $types      = '';

        foreach ($allowed as $col) {
            if (!empty($fields[$col])) {
                $val = $fields[$col];
                if (in_array($col, ['clinicPatientID', 'familyID', 'sex', 'birthDate'], true)) {
                    $conditions[] = "`{$col}` = ?";
                    $binds[]      = $val;
                } else {
                    $conditions[] = "`{$col}` LIKE ?";
                    $binds[]      = '%' . $val . '%';
                }
                $types .= 's';
            }
        }

        if (empty($conditions)) {
            return [];
        }

        $sql  = 'SELECT * FROM `' . self::VIEW . '` WHERE ' .
                implode(' AND ', $conditions) .
                ' ORDER BY `lastName` LIMIT ' . $this->queryLimit();
        $stmt = $this->prepare($sql);
        $stmt->bind_param($types, ...$binds);
        $stmt->execute();
        $result = $stmt->get_result();
        $rows   = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): bool
    {
        $stmt = $this->prepare(
            'INSERT INTO `' . self::TABLE . '`
             (`clinicPatientID`, `patientNationalID`, `familyID`,
              `lastName`, `lastName2`, `firstName`, `middleInitial`,
              `sex`, `birthDate`, `homeAddress1`, `homeAddress2`,
              `homeNeighborhood`, `homeCity`, `homeCounty`, `homeState`,
              `contactPhone`, `contactAltPhone`, `bloodType`, `organDonor`,
              `preferredLanguage`, `knownAllergies`, `currentMedications`,
              `responsibleParty`, `maritalStatus`, `profession`, `createdDate`)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())'
        );

        $n = null;
        $clinicPatientID    = $data['clinicPatientID']    ?? '';
        $patientNationalID  = $data['patientNationalID']  ?? null;
        $familyID           = $data['familyID']           ?? null;
        $lastName           = $data['lastName']           ?? '';
        $lastName2          = $data['lastName2']          ?? null;
        $firstName          = $data['firstName']          ?? '';
        $middleInitial      = $data['middleInitial']      ?? null;
        $sex                = $data['sex']                ?? '';
        $birthDate          = $data['birthDate']          ?? null;
        $homeAddress1       = $data['homeAddress1']       ?? null;
        $homeAddress2       = $data['homeAddress2']       ?? null;
        $homeNeighborhood   = $data['homeNeighborhood']   ?? null;
        $homeCity           = $data['homeCity']           ?? null;
        $homeCounty         = $data['homeCounty']         ?? null;
        $homeState          = $data['homeState']          ?? null;
        $contactPhone       = $data['contactPhone']       ?? null;
        $contactAltPhone    = $data['contactAltPhone']    ?? null;
        $bloodType          = $data['bloodType']          ?? null;
        $organDonor         = isset($data['organDonor']) ? (int) $data['organDonor'] : null;
        $preferredLanguage  = $data['preferredLanguage']  ?? null;
        $knownAllergies     = $data['knownAllergies']     ?? null;
        $currentMedications = $data['currentMedications'] ?? null;
        $responsibleParty   = $data['responsibleParty']   ?? null;
        $maritalStatus      = $data['maritalStatus']      ?? null;
        $profession         = $data['profession']         ?? null;

        $stmt->bind_param(
            'ssssssssssssssssssiissssss',
            $clinicPatientID, $patientNationalID, $familyID,
            $lastName, $lastName2, $firstName, $middleInitial,
            $sex, $birthDate, $homeAddress1, $homeAddress2,
            $homeNeighborhood, $homeCity, $homeCounty, $homeState,
            $contactPhone, $contactAltPhone, $bloodType, $organDonor,
            $preferredLanguage, $knownAllergies, $currentMedications,
            $responsibleParty, $maritalStatus, $profession
        );

        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    /**
     * @param array<string,mixed> $data  Only the fields to change (clinicPatientID excluded).
     */
    public function update(string $clinicPatientID, array $data): bool
    {
        $updatable = [
            'patientNationalID', 'familyID', 'lastName', 'lastName2',
            'firstName', 'middleInitial', 'sex', 'birthDate',
            'nextVaccinationDate', 'homeAddress1', 'homeAddress2',
            'homeNeighborhood', 'homeCity', 'homeCounty', 'homeState',
            'contactPhone', 'contactAltPhone', 'bloodType', 'organDonor',
            'preferredLanguage', 'knownAllergies', 'currentMedications',
            'responsibleParty', 'maritalStatus', 'profession',
        ];

        $sets   = [];
        $binds  = [];
        $types  = '';

        foreach ($updatable as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]  = "`{$col}` = ?";
                $binds[] = $data[$col];
                $types  .= 's';
            }
        }

        if (empty($sets)) {
            return false;
        }

        $sql  = 'UPDATE `' . self::TABLE . '` SET ' . implode(', ', $sets) .
                ' WHERE `clinicPatientID` = ? AND `active` = 1';
        $binds[] = $clinicPatientID;
        $types  .= 's';

        $stmt = $this->prepare($sql);
        $stmt->bind_param($types, ...$binds);
        $ok = $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $ok && $affected > 0;
    }

    public function deactivate(string $clinicPatientID): bool
    {
        $stmt = $this->prepare(
            'UPDATE `' . self::TABLE . '` SET `active` = 0' .
            ' WHERE `clinicPatientID` = ? AND `active` = 1'
        );
        $stmt->bind_param('s', $clinicPatientID);
        $ok = $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $ok && $affected > 0;
    }

    public function existsByClinicPatientID(string $clinicPatientID): bool
    {
        $stmt = $this->prepare(
            'SELECT 1 FROM `' . self::TABLE . '` WHERE `clinicPatientID` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $clinicPatientID);
        $stmt->execute();
        $stmt->store_result();
        $found = $stmt->num_rows > 0;
        $stmt->close();
        return $found;
    }

    /**
     * Returns the full patient row from the patient TABLE (not the view),
     * including the auto-increment `patientID`. Used when creating a visit
     * to build the patientVisitID and copy the demographic snapshot.
     *
     * @return array<string,mixed>|null
     */
    public function findRawByClinicPatientID(string $clinicPatientID): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::TABLE . '` WHERE `clinicPatientID` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $clinicPatientID);
        $stmt->execute();
        $result = $stmt->get_result();
        $row    = $result->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }
}
