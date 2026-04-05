<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Visit;
use PiClinic\Repositories\PatientRepository;
use PiClinic\Repositories\VisitRepository;
use PiClinic\Services\VisitService;

class VisitServiceTest extends TestCase
{
    private PatientRepository $patientRepo;
    private VisitRepository   $visitRepo;
    private VisitService      $service;

    /** @var array<string,mixed> Raw patient row (includes patientID) */
    private array $rawPatient = [
        'patientID'          => 42,
        'clinicPatientID'    => 'PT-001',
        'patientNationalID'  => null,
        'familyID'           => null,
        'lastName'           => 'Smith',
        'lastName2'          => null,
        'firstName'          => 'John',
        'sex'                => 'M',
        'birthDate'          => '1980-06-15 00:00:00',
        'homeAddress1'       => null,
        'homeAddress2'       => null,
        'homeNeighborhood'   => null,
        'homeCity'           => 'Springfield',
        'homeCounty'         => null,
        'homeState'          => null,
        'contactPhone'       => null,
        'contactAltPhone'    => null,
        'knownAllergies'     => null,
        'currentMedications' => null,
        'nextVaccinationDate' => null,
        'responsibleParty'   => null,
        'maritalStatus'      => null,
        'profession'         => null,
        'active'             => 1,
    ];

    /** @var array<string,mixed> Visit row as returned by visitGet view */
    private array $visitRow = [
        'patientVisitID'           => '000000000042202604050 1',
        'clinicPatientID'          => 'PT-001',
        'firstVisit'               => 'NO',
        'patientNationalID'        => null,
        'patientFamilyID'          => null,
        'staffName'                => null,
        'staffUsername'            => null,
        'staffPosition'            => null,
        'visitType'                => 'General',
        'visitStatus'              => 'Open',
        'primaryComplaint'         => null,
        'secondaryComplaint'       => null,
        'dateTimeIn'               => '2026-04-05 09:00:00',
        'dateTimeOut'              => null,
        'payment'                  => '0.00',
        'patientLastName'          => 'Smith',
        'patientFirstName'         => 'John',
        'patientSex'               => 'M',
        'patientBirthDate'         => '1980-06-15 00:00:00',
        'patientHomeAddress1'      => null,
        'patientHomeAddress2'      => null,
        'patientHomeNeighborhood'  => null,
        'patientHomeCity'          => 'Springfield',
        'patientHomeCounty'        => null,
        'patientHomeState'         => null,
        'patientContactPhone'      => null,
        'patientContactAltPhone'   => null,
        'patientKnownAllergies'    => null,
        'patientCurrentMedications' => null,
        'patientNextVaccinationDate' => null,
        'patientResponsibleParty'  => null,
        'patientMaritalStatus'     => null,
        'patientProfession'        => null,
        'height'                   => null,
        'heightUnits'              => null,
        'weight'                   => null,
        'weightUnits'              => null,
        'temp'                     => null,
        'tempUnits'                => null,
        'bpSystolic'               => null,
        'bpDiastolic'              => null,
        'pulse'                    => null,
        'glucose'                  => null,
        'glucoseUnits'             => null,
        'diagnosis1'               => null,
        'condition1'               => null,
        'diagnosis2'               => null,
        'condition2'               => null,
        'diagnosis3'               => null,
        'condition3'               => null,
        'referredTo'               => null,
        'referredFrom'             => null,
    ];

    protected function setUp(): void
    {
        $this->patientRepo = $this->createStub(PatientRepository::class);
        $this->visitRepo   = $this->createStub(VisitRepository::class);
        $this->service     = new VisitService($this->patientRepo, $this->visitRepo);
    }

    // -------------------------------------------------------------------------
    // getByPatientVisitID()
    // -------------------------------------------------------------------------

    public function testGetByPatientVisitIDReturnsVisit(): void
    {
        $this->visitRepo->method('findByPatientVisitID')->willReturn($this->visitRow);

        $visit = $this->service->getByPatientVisitID('000000000042202604050 1');

        $this->assertInstanceOf(Visit::class, $visit);
        $this->assertSame('PT-001', $visit->clinicPatientID);
        $this->assertSame('General', $visit->visitType);
    }

    public function testGetByPatientVisitIDThrows404WhenNotFound(): void
    {
        $this->visitRepo->method('findByPatientVisitID')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->getByPatientVisitID('does-not-exist');
    }

    // -------------------------------------------------------------------------
    // search()
    // -------------------------------------------------------------------------

    public function testSearchByClinicPatientIDReturnsVisits(): void
    {
        $this->visitRepo->method('findByClinicPatientID')->willReturn([$this->visitRow]);

        $results = $this->service->search(['clinicPatientID' => 'PT-001']);

        $this->assertCount(1, $results);
        $this->assertInstanceOf(Visit::class, $results[0]);
    }

    public function testSearchByStatusReturnsVisits(): void
    {
        $this->visitRepo->method('findByStatus')->willReturn([$this->visitRow]);

        $results = $this->service->search(['visitStatus' => 'Open']);

        $this->assertCount(1, $results);
    }

    public function testSearchWithNoParamsThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->search([]);
    }

    // -------------------------------------------------------------------------
    // create()
    // -------------------------------------------------------------------------

    public function testCreateReturnsVisit(): void
    {
        $this->patientRepo->method('findRawByClinicPatientID')->willReturn($this->rawPatient);
        $this->visitRepo->method('getMaxVisitIndex')->willReturn(0);
        $this->visitRepo->method('create')->willReturn(true);
        $this->visitRepo->method('findByPatientVisitID')->willReturn($this->visitRow);

        $visit = $this->service->create([
            'clinicPatientID' => 'PT-001',
            'visitType'       => 'General',
        ]);

        $this->assertInstanceOf(Visit::class, $visit);
        $this->assertSame('PT-001', $visit->clinicPatientID);
    }

    public function testCreateWithMissingClinicPatientIDThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create(['visitType' => 'General']);
    }

    public function testCreateWithMissingVisitTypeThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create(['clinicPatientID' => 'PT-001']);
    }

    public function testCreateWithUnknownPatientThrows404(): void
    {
        $this->patientRepo->method('findRawByClinicPatientID')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->create(['clinicPatientID' => 'UNKNOWN', 'visitType' => 'General']);
    }

    public function testCreateWithInvalidStaffPositionThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create([
            'clinicPatientID' => 'PT-001',
            'visitType'       => 'General',
            'staffPosition'   => 'Wizard',
        ]);
    }

    public function testCreateExceedingMaxVisitIndexThrows500(): void
    {
        $this->patientRepo->method('findRawByClinicPatientID')->willReturn($this->rawPatient);
        $this->visitRepo->method('getMaxVisitIndex')->willReturn(99);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(500);

        $this->service->create(['clinicPatientID' => 'PT-001', 'visitType' => 'General']);
    }

    // -------------------------------------------------------------------------
    // update()
    // -------------------------------------------------------------------------

    public function testUpdateReturnsUpdatedVisit(): void
    {
        $updated = array_merge($this->visitRow, ['primaryComplaint' => 'Headache']);
        $this->visitRepo->method('findByPatientVisitID')
                        ->willReturnOnConsecutiveCalls($this->visitRow, $updated);
        $this->visitRepo->method('update')->willReturn(true);

        $visit = $this->service->update('000000000042202604050 1', ['primaryComplaint' => 'Headache']);

        $this->assertSame('Headache', $visit->primaryComplaint);
    }

    public function testUpdateThrows404WhenVisitNotFound(): void
    {
        $this->visitRepo->method('findByPatientVisitID')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->update('does-not-exist', ['visitStatus' => 'Closed']);
    }

    public function testUpdateWithNoFieldsThrows400(): void
    {
        $this->visitRepo->method('findByPatientVisitID')->willReturn($this->visitRow);
        $this->visitRepo->method('update')->willReturn(false);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->update('000000000042202604050 1', []);
    }

    public function testUpdateWithInvalidVisitStatusThrows400(): void
    {
        $this->visitRepo->method('findByPatientVisitID')->willReturn($this->visitRow);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->update('000000000042202604050 1', ['visitStatus' => 'Pending']);
    }

    public function testUpdateWithInvalidStaffPositionThrows400(): void
    {
        $this->visitRepo->method('findByPatientVisitID')->willReturn($this->visitRow);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->update('000000000042202604050 1', ['staffPosition' => 'Wizard']);
    }

    // -------------------------------------------------------------------------
    // delete()
    // -------------------------------------------------------------------------

    public function testDeleteSucceeds(): void
    {
        $visitRepo = $this->createMock(VisitRepository::class);
        $visitRepo->method('findByPatientVisitID')->willReturn($this->visitRow);
        $visitRepo->expects($this->once())->method('softDelete')->willReturn(true);

        (new VisitService($this->patientRepo, $visitRepo))->delete('000000000042202604050 1');
    }

    public function testDeleteThrows404WhenVisitNotFound(): void
    {
        $this->visitRepo->method('findByPatientVisitID')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->delete('does-not-exist');
    }
}
