<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\LogEntry;
use PiClinic\Repositories\LogRepository;
use PiClinic\Services\LogService;

class LogServiceTest extends TestCase
{
    private LogRepository $repo;
    private LogService    $service;

    /** @var array<string,mixed> */
    private array $logRow = [
        'logId'            => 1,
        'sourceModule'     => 'patient',
        'userToken'        => 'tok-abc123',
        'logClass'         => 'API',
        'logTable'         => 'patient',
        'logAction'        => 'GET',
        'logQueryString'   => 'clinicPatientID=PT-001',
        'logBeforeData'    => null,
        'logAfterData'     => null,
        'logStatusCode'    => '200',
        'logStatusMessage' => 'Success',
        'createdDate'      => '2026-04-06 10:30:00',
    ];

    protected function setUp(): void
    {
        $this->repo    = $this->createStub(LogRepository::class);
        $this->service = new LogService($this->repo);
    }

    // -------------------------------------------------------------------------
    // search()
    // -------------------------------------------------------------------------

    public function testSearchReturnsLogEntries(): void
    {
        $this->repo->method('search')->willReturn([$this->logRow]);

        $result = $this->service->search(['logClass' => 'API']);

        $this->assertCount(1, $result);
        $this->assertInstanceOf(LogEntry::class, $result[0]);
        $this->assertSame('API', $result[0]->logClass);
        $this->assertSame('patient', $result[0]->sourceModule);
    }

    public function testSearchReturnsEmptyArrayWhenNoneFound(): void
    {
        $this->repo->method('search')->willReturn([]);

        $result = $this->service->search(['logDate' => '2000-01-01']);

        $this->assertSame([], $result);
    }

    public function testSearchMapsCreatedDateToLogDate(): void
    {
        $this->repo->method('search')->willReturn([$this->logRow]);

        $result = $this->service->search([]);

        $this->assertSame('2026-04-06 10:30:00', $result[0]->logDate);
    }

    // -------------------------------------------------------------------------
    // write()
    // -------------------------------------------------------------------------

    public function testWriteRequiresUserToken(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->write([
            'logClass'         => 'API',
            'logStatusMessage' => 'Success',
        ]);
    }

    public function testWriteRequiresLogClass(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->write([
            'userToken'        => 'tok-abc123',
            'logStatusMessage' => 'Success',
        ]);
    }

    public function testWriteRequiresLogStatusMessage(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->write([
            'userToken' => 'tok-abc123',
            'logClass'  => 'API',
        ]);
    }

    public function testWriteReturnsLogEntry(): void
    {
        $this->repo->method('create')->willReturn(1);
        $this->repo->method('findById')->willReturn($this->logRow);

        $entry = $this->service->write([
            'userToken'        => 'tok-abc123',
            'logClass'         => 'API',
            'logStatusMessage' => 'Success',
        ]);

        $this->assertInstanceOf(LogEntry::class, $entry);
        $this->assertSame(1, $entry->logId);
        $this->assertSame('API', $entry->logClass);
    }

    public function testWriteThrows500WhenRetrievalFails(): void
    {
        $this->repo->method('create')->willReturn(99);
        $this->repo->method('findById')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(500);

        $this->service->write([
            'userToken'        => 'tok-abc123',
            'logClass'         => 'API',
            'logStatusMessage' => 'Success',
        ]);
    }
}
