<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Clinic;
use PiClinic\Repositories\ClinicRepository;
use PiClinic\Services\ClinicService;

class ClinicServiceTest extends TestCase
{
    private ClinicRepository $repo;
    private ClinicService    $service;

    /** @var array<string,mixed> */
    private array $clinicRow = [
        'clinicID'           => 1,
        'thisClinic'         => 1,
        'publicID'           => 'CL01',
        'typeCode'           => null,
        'careLevel'          => null,
        'longName'           => 'Springfield Community Clinic',
        'shortName'          => 'SCC',
        'currency'           => 'USD',
        'address1'           => '123 Main St',
        'address2'           => null,
        'clinicNeighborhood' => null,
        'clinicCity'         => 'Springfield',
        'clinicState'        => 'IL',
        'clinicRegion'       => 'Midwest',
        'clinicDirector'     => 'Dr. Burns',
        'clinicService'      => null,
        'modifiedDate'       => '2026-01-01 00:00:00',
        'createdDate'        => '2025-01-01 00:00:00',
    ];

    protected function setUp(): void
    {
        $this->repo    = $this->createStub(ClinicRepository::class);
        $this->service = new ClinicService($this->repo);
    }

    public function testSearchByThisClinicReturnsClinic(): void
    {
        $this->repo->method('findThisClinic')->willReturn($this->clinicRow);

        $results = $this->service->search(['thisClinic' => '1']);

        $this->assertCount(1, $results);
        $this->assertInstanceOf(Clinic::class, $results[0]);
        $this->assertSame('CL01', $results[0]->publicID);
    }

    public function testSearchByThisClinicThrows404WhenNoneDesignated(): void
    {
        $this->repo->method('findThisClinic')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->search(['thisClinic' => '1']);
    }

    public function testSearchByPublicIDReturnsClinic(): void
    {
        $this->repo->method('findByPublicID')->willReturn($this->clinicRow);

        $results = $this->service->search(['publicID' => 'CL01']);

        $this->assertCount(1, $results);
        $this->assertSame('Springfield Community Clinic', $results[0]->longName);
    }

    public function testSearchByPublicIDThrows404WhenNotFound(): void
    {
        $this->repo->method('findByPublicID')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->search(['publicID' => 'NO-SUCH']);
    }

    public function testSearchByShortNameReturnsResults(): void
    {
        $this->repo->method('findByShortName')->willReturn([$this->clinicRow]);

        $results = $this->service->search(['shortName' => 'SCC']);

        $this->assertCount(1, $results);
    }

    public function testSearchWithNoParamsThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->search([]);
    }
}
