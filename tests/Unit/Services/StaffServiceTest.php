<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Staff;
use PiClinic\Repositories\StaffRepository;
use PiClinic\Services\StaffService;

class StaffServiceTest extends TestCase
{
    private StaffRepository $repo;
    private StaffService    $service;

    /** @var array<string,mixed> Staff row as returned by staffGetByUser view (no password) */
    private array $staffRow = [
        'memberID'               => 'M001',
        'username'               => 'jsmith',
        'lastName'               => 'Smith',
        'firstName'              => 'Jane',
        'position'               => 'Nurse',
        'medicalStaff'           => 1,
        'preferredLanguage'      => 'en',
        'preferredClinicPublicID' => 'CL01',
        'contactInfo'            => null,
        'altContactInfo'         => null,
        'active'                 => 1,
        'accessGranted'          => 'ClinicStaff',
        'lastLogin'              => null,
        'modifiedDate'           => '2026-04-05 09:00:00',
        'createdDate'            => '2026-01-01 00:00:00',
    ];

    protected function setUp(): void
    {
        $this->repo    = $this->createStub(StaffRepository::class);
        $this->service = new StaffService($this->repo);
    }

    // -------------------------------------------------------------------------
    // getByUsername()
    // -------------------------------------------------------------------------

    public function testGetByUsernameReturnsStaff(): void
    {
        $this->repo->method('findOneByUsername')->willReturn($this->staffRow);

        $staff = $this->service->getByUsername('jsmith');

        $this->assertInstanceOf(Staff::class, $staff);
        $this->assertSame('jsmith', $staff->username);
        $this->assertSame(1, $staff->medicalStaff);
    }

    public function testGetByUsernameThrows404WhenNotFound(): void
    {
        $this->repo->method('findOneByUsername')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->getByUsername('nobody');
    }

    // -------------------------------------------------------------------------
    // list()
    // -------------------------------------------------------------------------

    public function testListReturnsAllStaff(): void
    {
        $this->repo->method('findAll')->willReturn([$this->staffRow]);

        $results = $this->service->list([]);

        $this->assertCount(1, $results);
        $this->assertInstanceOf(Staff::class, $results[0]);
    }

    public function testListFiltersByPosition(): void
    {
        $this->repo->method('findAll')->willReturn([$this->staffRow]);

        $results = $this->service->list(['position' => 'Nurse']);

        $this->assertCount(1, $results);
    }

    public function testListWithInvalidPositionThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->list(['position' => 'Wizard']);
    }

    // -------------------------------------------------------------------------
    // create()
    // -------------------------------------------------------------------------

    public function testCreateReturnsStaff(): void
    {
        $this->repo->method('existsByUsername')->willReturn(false);
        $this->repo->method('create')->willReturn(true);
        $this->repo->method('findOneByUsername')->willReturn($this->staffRow);

        $staff = $this->service->create([
            'username'      => 'jsmith',
            'lastName'      => 'Smith',
            'firstName'     => 'Jane',
            'position'      => 'Nurse',
            'password'      => 'secret123',
            'accessGranted' => 'ClinicStaff',
        ]);

        $this->assertInstanceOf(Staff::class, $staff);
    }

    public function testCreateWithMissingUsernameThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create([
            'lastName' => 'Smith', 'firstName' => 'Jane',
            'position' => 'Nurse', 'password' => 'secret', 'accessGranted' => 'ClinicStaff',
        ]);
    }

    public function testCreateWithMissingPasswordThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create([
            'username' => 'jsmith', 'lastName' => 'Smith', 'firstName' => 'Jane',
            'position' => 'Nurse', 'accessGranted' => 'ClinicStaff',
        ]);
    }

    public function testCreateWithInvalidPositionThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create([
            'username' => 'jsmith', 'lastName' => 'Smith', 'firstName' => 'Jane',
            'position' => 'Wizard', 'password' => 'secret', 'accessGranted' => 'ClinicStaff',
        ]);
    }

    public function testCreateWithInvalidAccessGrantedThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create([
            'username' => 'jsmith', 'lastName' => 'Smith', 'firstName' => 'Jane',
            'position' => 'Nurse', 'password' => 'secret', 'accessGranted' => 'SuperUser',
        ]);
    }

    public function testCreateWithDuplicateUsernameThrows409(): void
    {
        $this->repo->method('existsByUsername')->willReturn(true);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(409);

        $this->service->create([
            'username' => 'jsmith', 'lastName' => 'Smith', 'firstName' => 'Jane',
            'position' => 'Nurse', 'password' => 'secret', 'accessGranted' => 'ClinicStaff',
        ]);
    }

    // -------------------------------------------------------------------------
    // update()
    // -------------------------------------------------------------------------

    public function testUpdateReturnsUpdatedStaff(): void
    {
        $updated = array_merge($this->staffRow, ['lastName' => 'Jones']);
        $this->repo->method('findOneByUsername')
                   ->willReturnOnConsecutiveCalls($this->staffRow, $updated);
        $this->repo->method('update')->willReturn(true);

        $staff = $this->service->update('jsmith', ['lastName' => 'Jones']);

        $this->assertSame('Jones', $staff->lastName);
    }

    public function testUpdateThrows404WhenNotFound(): void
    {
        $this->repo->method('findOneByUsername')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->update('nobody', ['lastName' => 'Jones']);
    }

    public function testUpdateWithNoFieldsThrows400(): void
    {
        $this->repo->method('findOneByUsername')->willReturn($this->staffRow);
        $this->repo->method('update')->willReturn(false);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->update('jsmith', []);
    }

    public function testUpdateWithInvalidPreferredLanguageThrows400(): void
    {
        $this->repo->method('findOneByUsername')->willReturn($this->staffRow);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->update('jsmith', ['preferredLanguage' => 'fr']);
    }

    // -------------------------------------------------------------------------
    // delete()
    // -------------------------------------------------------------------------

    public function testDeleteSucceeds(): void
    {
        $repo = $this->createMock(StaffRepository::class);
        $repo->method('findOneByUsername')->willReturn($this->staffRow);
        $repo->expects($this->once())->method('deactivate')->willReturn(true);

        (new StaffService($repo))->delete('jsmith');
    }

    public function testDeleteThrows404WhenNotFound(): void
    {
        $this->repo->method('findOneByUsername')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->delete('nobody');
    }
}
