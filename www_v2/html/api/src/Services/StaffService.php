<?php
declare(strict_types=1);

namespace PiClinic\Services;

use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Staff;
use PiClinic\Repositories\StaffRepository;

class StaffService
{
    private const VALID_POSITION = [
        'Nurse', 'NursesAid', 'NursingStudent', 'DoctorGeneral',
        'DoctorSpecialist', 'MedicalStudent', 'ClinicStaff', 'Other',
    ];
    private const VALID_ACCESS = [
        'SystemAdmin', 'ClinicAdmin', 'ClinicStaff', 'ClinicReadOnly',
    ];
    private const VALID_LANGUAGE = ['en', 'es', 'ui'];

    public function __construct(private StaffRepository $repo) {}

    public function getByUsername(string $username): Staff
    {
        $row = $this->repo->findOneByUsername($username);
        if ($row === null) {
            throw new HttpException(404, 'Staff member not found.');
        }
        return Staff::fromRow($row);
    }

    /**
     * @param array<string,string> $params  Query-string params.
     * @return Staff[]
     */
    public function list(array $params): array
    {
        $position = $params['position'] ?? null;
        $activeParam = $params['active'] ?? null;

        if ($position !== null && !in_array($position, self::VALID_POSITION, true)) {
            throw new HttpException(400, 'Invalid value for position.');
        }

        $active = null;
        if ($activeParam !== null) {
            $active = ($activeParam === '1' || strtolower($activeParam) === 'true');
        }

        $rows = $this->repo->findAll(
            ($position !== null && $position !== '') ? $position : null,
            $active
        );
        return array_map(fn(array $r) => Staff::fromRow($r), $rows);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Staff
    {
        $data = $this->trimStrings($data);
        $this->requireFields($data, ['username', 'lastName', 'firstName', 'position', 'password', 'accessGranted']);
        $this->validateEnums($data);

        if ($this->repo->existsByUsername($data['username'])) {
            throw new HttpException(409, 'A staff member with that username already exists.');
        }

        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

        if (!$this->repo->create($data)) {
            throw new HttpException(500, 'Failed to create staff record.');
        }

        $row = $this->repo->findOneByUsername($data['username']);
        if ($row === null) {
            throw new HttpException(500, 'Staff created but could not be retrieved.');
        }
        return Staff::fromRow($row);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(string $username, array $data): Staff
    {
        $existing = $this->repo->findOneByUsername($username);
        if ($existing === null) {
            throw new HttpException(404, 'Staff member not found.');
        }

        $data = $this->trimStrings($data);
        $this->validateEnums($data);

        // Hash a new password if one was provided.
        if (!empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        } else {
            unset($data['password']);
        }

        if (!$this->repo->update($username, $data)) {
            throw new HttpException(400, 'No updatable fields provided.');
        }

        $row = $this->repo->findOneByUsername($username);
        if ($row === null) {
            throw new HttpException(500, 'Staff updated but could not be retrieved.');
        }
        return Staff::fromRow($row);
    }

    public function delete(string $username): void
    {
        $existing = $this->repo->findOneByUsername($username);
        if ($existing === null) {
            throw new HttpException(404, 'Staff member not found.');
        }

        if (!$this->repo->deactivate($username)) {
            throw new HttpException(500, 'Failed to deactivate staff record.');
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
        if (isset($data['position']) && $data['position'] !== '' &&
            !in_array($data['position'], self::VALID_POSITION, true)) {
            throw new HttpException(400, 'Invalid value for position.');
        }
        if (isset($data['accessGranted']) && $data['accessGranted'] !== '' &&
            !in_array($data['accessGranted'], self::VALID_ACCESS, true)) {
            throw new HttpException(400, 'Invalid value for accessGranted.');
        }
        if (isset($data['preferredLanguage']) && $data['preferredLanguage'] !== '' &&
            !in_array($data['preferredLanguage'], self::VALID_LANGUAGE, true)) {
            throw new HttpException(400, 'Invalid value for preferredLanguage.');
        }
    }

    /**
     * @param array<string,mixed> $data
     * @return array<string,mixed>
     */
    private function trimStrings(array $data): array
    {
        $stringFields = [
            'username', 'lastName', 'firstName', 'memberID',
            'contactInfo', 'altContactInfo', 'preferredClinicPublicID',
        ];
        foreach ($stringFields as $f) {
            if (isset($data[$f]) && is_string($data[$f])) {
                $data[$f] = trim($data[$f]);
            }
        }
        return $data;
    }
}
