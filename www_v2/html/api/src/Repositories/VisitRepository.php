<?php
declare(strict_types=1);

namespace PiClinic\Repositories;

class VisitRepository extends BaseRepository
{
    private const VIEW       = 'visitGet';
    private const VIEW_CHECK = 'visitCheck';
    private const TABLE      = 'visit';

    /** @return array<string,mixed>|null */
    public function findByPatientVisitID(string $patientVisitID): ?array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::VIEW . '` WHERE `patientVisitID` = ? LIMIT 1'
        );
        $stmt->bind_param('s', $patientVisitID);
        $stmt->execute();
        $result = $this->getResult($stmt);
        $row    = $result->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * Find visits for a patient, optionally filtered by status.
     * Returns newest first.
     *
     * @return array<int,array<string,mixed>>
     */
    public function findByClinicPatientID(string $clinicPatientID, ?string $visitStatus = null): array
    {
        if ($visitStatus !== null) {
            $stmt = $this->prepare(
                'SELECT * FROM `' . self::VIEW . '`' .
                ' WHERE `clinicPatientID` = ? AND `visitStatus` = ?' .
                ' ORDER BY `dateTimeIn` DESC LIMIT ' . $this->queryLimit()
            );
            $stmt->bind_param('ss', $clinicPatientID, $visitStatus);
        } else {
            $stmt = $this->prepare(
                'SELECT * FROM `' . self::VIEW . '`' .
                ' WHERE `clinicPatientID` = ?' .
                ' ORDER BY `dateTimeIn` DESC LIMIT ' . $this->queryLimit()
            );
            $stmt->bind_param('s', $clinicPatientID);
        }
        $stmt->execute();
        $rows = $this->getResult($stmt)->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * Find visits by visitStatus across all patients.
     *
     * @return array<int,array<string,mixed>>
     */
    public function findByStatus(string $visitStatus): array
    {
        $stmt = $this->prepare(
            'SELECT * FROM `' . self::VIEW . '`' .
            ' WHERE `visitStatus` = ?' .
            ' ORDER BY `dateTimeIn` DESC LIMIT ' . $this->queryLimit()
        );
        $stmt->bind_param('s', $visitStatus);
        $stmt->execute();
        $rows = $this->getResult($stmt)->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /**
     * Returns the highest patientVisitIndex for a patient on a given date
     * (YYYY-MM-DD). Returns 0 if no visits exist yet that day.
     */
    public function getMaxVisitIndex(string $clinicPatientID, string $visitDate): int
    {
        $stmt = $this->prepare(
            'SELECT MAX(`patientVisitIndex`) AS `maxIdx` FROM `' . self::VIEW_CHECK . '`' .
            ' WHERE `clinicPatientID` = ? AND DATE(`dateTimeIn`) = ?'
        );
        $stmt->bind_param('ss', $clinicPatientID, $visitDate);
        $stmt->execute();
        $result = $this->getResult($stmt)->fetch_assoc();
        $stmt->close();
        return (int) ($result['maxIdx'] ?? 0);
    }

    /**
     * @param array<string,mixed> $data  Fully-built visit row ready for INSERT.
     */
    public function create(array $data): bool
    {
        $stmt = $this->prepare(
            'INSERT INTO `' . self::TABLE . '`
             (`patientVisitID`, `patientID`, `clinicPatientID`, `patientNationalID`,
              `patientFamilyID`, `visitType`, `visitStatus`, `dateTimeIn`,
              `staffUsername`, `staffName`, `staffPosition`,
              `primaryComplaint`,
              `firstVisit`,
              `patientLastName`, `patientFirstName`, `patientSex`, `patientBirthDate`,
              `patientHomeAddress1`, `patientHomeAddress2`, `patientHomeNeighborhood`,
              `patientHomeCity`, `patientHomeCounty`, `patientHomeState`,
              `patientContactPhone`, `patientContactAltPhone`,
              `patientKnownAllergies`, `patientCurrentMedications`,
              `patientNextVaccinationDate`, `patientResponsibleParty`,
              `patientMaritalStatus`, `patientProfession`,
              `createdDate`)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())'
        );

        $patientVisitID           = $data['patientVisitID'];
        $patientID                = (int) $data['patientID'];
        $clinicPatientID          = $data['clinicPatientID'];
        $patientNationalID        = $data['patientNationalID']        ?? null;
        $patientFamilyID          = $data['patientFamilyID']          ?? null;
        $visitType                = $data['visitType'];
        $visitStatus              = $data['visitStatus']              ?? 'Open';
        $dateTimeIn               = $data['dateTimeIn'];
        $staffUsername            = $data['staffUsername']            ?? null;
        $staffName                = $data['staffName']                ?? null;
        $staffPosition            = $data['staffPosition']            ?? null;
        $primaryComplaint         = $data['primaryComplaint']         ?? null;
        $firstVisit               = $data['firstVisit']               ?? 'NO';
        $patientLastName          = $data['patientLastName']          ?? '';
        $patientFirstName         = $data['patientFirstName']         ?? '';
        $patientSex               = $data['patientSex']               ?? '';
        $patientBirthDate         = $data['patientBirthDate']         ?? null;
        $patientHomeAddress1      = $data['patientHomeAddress1']      ?? null;
        $patientHomeAddress2      = $data['patientHomeAddress2']      ?? null;
        $patientHomeNeighborhood  = $data['patientHomeNeighborhood']  ?? null;
        $patientHomeCity          = $data['patientHomeCity']          ?? null;
        $patientHomeCounty        = $data['patientHomeCounty']        ?? null;
        $patientHomeState         = $data['patientHomeState']         ?? null;
        $patientContactPhone      = $data['patientContactPhone']      ?? null;
        $patientContactAltPhone   = $data['patientContactAltPhone']   ?? null;
        $patientKnownAllergies    = $data['patientKnownAllergies']    ?? null;
        $patientCurrentMedications = $data['patientCurrentMedications'] ?? null;
        $patientNextVaccinationDate = $data['patientNextVaccinationDate'] ?? null;
        $patientResponsibleParty  = $data['patientResponsibleParty']  ?? null;
        $patientMaritalStatus     = $data['patientMaritalStatus']     ?? null;
        $patientProfession        = $data['patientProfession']        ?? null;

        $stmt->bind_param(
            'sisssssssssssssssssssssssssssss',
            $patientVisitID, $patientID, $clinicPatientID, $patientNationalID,
            $patientFamilyID, $visitType, $visitStatus, $dateTimeIn,
            $staffUsername, $staffName, $staffPosition,
            $primaryComplaint,
            $firstVisit,
            $patientLastName, $patientFirstName, $patientSex, $patientBirthDate,
            $patientHomeAddress1, $patientHomeAddress2, $patientHomeNeighborhood,
            $patientHomeCity, $patientHomeCounty, $patientHomeState,
            $patientContactPhone, $patientContactAltPhone,
            $patientKnownAllergies, $patientCurrentMedications,
            $patientNextVaccinationDate, $patientResponsibleParty,
            $patientMaritalStatus, $patientProfession
        );

        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    /**
     * @param array<string,mixed> $data  Fields to update (patientVisitID excluded).
     */
    public function update(string $patientVisitID, array $data): bool
    {
        $updatable = [
            'staffName', 'staffUsername', 'staffPosition',
            'visitType', 'visitStatus',
            'primaryComplaint', 'secondaryComplaint',
            'dateTimeIn', 'dateTimeOut', 'payment',
            'height', 'heightUnits', 'weight', 'weightUnits',
            'temp', 'tempUnits', 'bpSystolic', 'bpDiastolic',
            'pulse', 'glucose', 'glucoseUnits',
            'diagnosis1', 'condition1',
            'diagnosis2', 'condition2',
            'diagnosis3', 'condition3',
            'referredTo', 'referredFrom',
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

        $sql     = 'UPDATE `' . self::TABLE . '` SET ' . implode(', ', $sets) .
                   ' WHERE `patientVisitID` = ? AND `deleted` = 0';
        $binds[] = $patientVisitID;
        $types  .= 's';

        $stmt = $this->prepare($sql);
        $stmt->bind_param($types, ...$binds);
        $ok       = $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $ok && $affected > 0;
    }

    public function softDelete(string $patientVisitID): bool
    {
        $stmt = $this->prepare(
            'UPDATE `' . self::TABLE . '` SET `deleted` = 1, `visitStatus` = \'Deleted\'' .
            ' WHERE `patientVisitID` = ? AND `deleted` = 0'
        );
        $stmt->bind_param('s', $patientVisitID);
        $ok       = $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $ok && $affected > 0;
    }
}
