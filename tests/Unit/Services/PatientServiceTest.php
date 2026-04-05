<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Patient;
use PiClinic\Repositories\PatientRepository;
use PiClinic\Services\PatientService;

class PatientServiceTest extends TestCase
{
    private PatientRepository $repo;
    private PatientService    $service;

    /** @var array<string,mixed> */
    private array $activePatientRow = [
        'clinicPatientID'    => 'PT-001',
        'patientNationalID'  => null,
        'familyID'           => null,
        'lastName'           => 'Smith',
        'lastName2'          => null,
        'firstName'          => 'John',
        'middleInitial'      => null,
        'sex'                => 'M',
        'birthDate'          => '1980-06-15 00:00:00',
        'nextVaccinationDate' => null,
        'homeAddress1'       => null,
        'homeAddress2'       => null,
        'homeNeighborhood'   => null,
        'homeCity'           => 'Springfield',
        'homeCounty'         => null,
        'homeState'          => null,
        'contactPhone'       => null,
        'contactAltPhone'    => null,
        'bloodType'          => null,
        'organDonor'         => null,
        'preferredLanguage'  => 'en',
        'knownAllergies'     => null,
        'currentMedications' => null,
        'responsibleParty'   => null,
        'maritalStatus'      => null,
        'profession'         => null,
    ];

    protected function setUp(): void
    {
        $this->repo    = $this->createStub(PatientRepository::class);
        $this->service = new PatientService($this->repo);
    }

    // -------------------------------------------------------------------------
    // getById()
    // -------------------------------------------------------------------------

    public function testGetByIdReturnsPatient(): void
    {
        $this->repo->method('findById')->willReturn($this->activePatientRow);

        $patient = $this->service->getById('PT-001');

        $this->assertInstanceOf(Patient::class, $patient);
        $this->assertSame('PT-001', $patient->clinicPatientID);
        $this->assertSame('Smith', $patient->lastName);
        $this->assertSame('M', $patient->sex);
    }

    public function testGetByIdThrows404WhenNotFound(): void
    {
        $this->repo->method('findById')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->getById('NO-SUCH-PATIENT');
    }

    // -------------------------------------------------------------------------
    // search()
    // -------------------------------------------------------------------------

    public function testSearchByQReturnsPatients(): void
    {
        $this->repo->method('search')->willReturn([$this->activePatientRow]);

        $results = $this->service->search(['q' => 'Smith']);

        $this->assertCount(1, $results);
        $this->assertInstanceOf(Patient::class, $results[0]);
    }

    public function testSearchByFieldsReturnsPatients(): void
    {
        $this->repo->method('searchByFields')->willReturn([$this->activePatientRow]);

        $results = $this->service->search(['lastName' => 'Smith']);

        $this->assertCount(1, $results);
        $this->assertSame('Smith', $results[0]->lastName);
    }

    public function testSearchWithNoParamsReturnsEmptyArray(): void
    {
        $this->repo->method('searchByFields')->willReturn([]);

        $results = $this->service->search([]);

        $this->assertSame([], $results);
    }

    // -------------------------------------------------------------------------
    // create()
    // -------------------------------------------------------------------------

    public function testCreateReturnsPatient(): void
    {
        $this->repo->method('existsByClinicPatientID')->willReturn(false);
        $this->repo->method('create')->willReturn(true);
        $this->repo->method('findById')->willReturn($this->activePatientRow);

        $patient = $this->service->create([
            'clinicPatientID' => 'PT-001',
            'lastName'        => 'Smith',
            'firstName'       => 'John',
            'sex'             => 'M',
        ]);

        $this->assertInstanceOf(Patient::class, $patient);
        $this->assertSame('PT-001', $patient->clinicPatientID);
    }

    public function testCreateWithMissingClinicPatientIDThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create(['lastName' => 'Smith', 'firstName' => 'John', 'sex' => 'M']);
    }

    public function testCreateWithMissingLastNameThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create(['clinicPatientID' => 'PT-001', 'firstName' => 'John', 'sex' => 'M']);
    }

    public function testCreateWithMissingFirstNameThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create(['clinicPatientID' => 'PT-001', 'lastName' => 'Smith', 'sex' => 'M']);
    }

    public function testCreateWithMissingSexThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create(['clinicPatientID' => 'PT-001', 'lastName' => 'Smith', 'firstName' => 'John']);
    }

    public function testCreateWithInvalidSexThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create([
            'clinicPatientID' => 'PT-001',
            'lastName'        => 'Smith',
            'firstName'       => 'John',
            'sex'             => 'Male',
        ]);
    }

    public function testCreateWithInvalidBloodTypeThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create([
            'clinicPatientID' => 'PT-001',
            'lastName'        => 'Smith',
            'firstName'       => 'John',
            'sex'             => 'M',
            'bloodType'       => 'Z+',
        ]);
    }

    public function testCreateWithDuplicateClinicPatientIDThrows409(): void
    {
        $this->repo->method('existsByClinicPatientID')->willReturn(true);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(409);

        $this->service->create([
            'clinicPatientID' => 'PT-001',
            'lastName'        => 'Smith',
            'firstName'       => 'John',
            'sex'             => 'M',
        ]);
    }

    // -------------------------------------------------------------------------
    // update()
    // -------------------------------------------------------------------------

    public function testUpdateReturnsUpdatedPatient(): void
    {
        $updated = array_merge($this->activePatientRow, ['homeCity' => 'Shelbyville']);
        $this->repo->method('findById')
                   ->willReturnOnConsecutiveCalls($this->activePatientRow, $updated);
        $this->repo->method('update')->willReturn(true);

        $patient = $this->service->update('PT-001', ['homeCity' => 'Shelbyville']);

        $this->assertSame('Shelbyville', $patient->homeCity);
    }

    public function testUpdateThrows404WhenPatientNotFound(): void
    {
        $this->repo->method('findById')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->update('NO-SUCH', ['lastName' => 'Jones']);
    }

    public function testUpdateWithNoFieldsThrows400(): void
    {
        $this->repo->method('findById')->willReturn($this->activePatientRow);
        $this->repo->method('update')->willReturn(false);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->update('PT-001', []);
    }

    public function testUpdateWithInvalidMaritalStatusThrows400(): void
    {
        $this->repo->method('findById')->willReturn($this->activePatientRow);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->update('PT-001', ['maritalStatus' => 'Complicated']);
    }

    // -------------------------------------------------------------------------
    // delete()
    // -------------------------------------------------------------------------

    public function testDeleteSucceeds(): void
    {
        // Use createMock() to verify deactivate() is called exactly once.
        $repo = $this->createMock(PatientRepository::class);
        $repo->method('findById')->willReturn($this->activePatientRow);
        $repo->expects($this->once())->method('deactivate')->willReturn(true);

        (new PatientService($repo))->delete('PT-001');
    }

    public function testDeleteThrows404WhenPatientNotFound(): void
    {
        $this->repo->method('findById')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->delete('NO-SUCH');
    }
}
