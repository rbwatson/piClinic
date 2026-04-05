<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\IcdCode;
use PiClinic\Repositories\IcdRepository;
use PiClinic\Services\IcdService;

class IcdServiceTest extends TestCase
{
    private IcdRepository $repo;
    private IcdService    $service;

    /** @var array<string,mixed> */
    private array $icdRow = [
        'language'         => 'en',
        'icd10code'        => 'J06.9',
        'icd10index'       => 'J069',
        'shortDescription' => 'Acute upper respiratory infection, unspecified',
        'useCount'         => 0,
        'lastUsedDate'     => null,
    ];

    protected function setUp(): void
    {
        $this->repo    = $this->createStub(IcdRepository::class);
        $this->service = new IcdService($this->repo);
    }

    // -------------------------------------------------------------------------
    // search()
    // -------------------------------------------------------------------------

    public function testSearchByQReturnsResults(): void
    {
        $this->repo->method('searchByCodeOrText')->willReturn([$this->icdRow]);

        $results = $this->service->search(['q' => 'respiratory']);

        $this->assertCount(1, $results);
        $this->assertInstanceOf(IcdCode::class, $results[0]);
        $this->assertSame('J06.9', $results[0]->icd10code);
    }

    public function testSearchByTReturnsResults(): void
    {
        $this->repo->method('searchByText')->willReturn([$this->icdRow]);

        $results = $this->service->search(['t' => 'respiratory']);

        $this->assertCount(1, $results);
    }

    public function testSearchByCReturnsResults(): void
    {
        $this->repo->method('searchByCode')->willReturn([$this->icdRow]);

        $results = $this->service->search(['c' => 'J06']);

        $this->assertCount(1, $results);
    }

    public function testSearchWithNoParamsThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->search([]);
    }

    public function testSearchWithInvalidLanguageThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->search(['q' => 'fever', 'language' => 'fr']);
    }

    public function testSearchWithSpanishLanguageReturnsResults(): void
    {
        $spanish = array_merge($this->icdRow, ['language' => 'es', 'shortDescription' => 'Infección aguda']);
        $this->repo->method('searchByCodeOrText')->willReturn([$spanish]);

        $results = $this->service->search(['q' => 'infección', 'language' => 'es']);

        $this->assertCount(1, $results);
        $this->assertSame('es', $results[0]->language);
    }

    // -------------------------------------------------------------------------
    // getByCode()
    // -------------------------------------------------------------------------

    public function testGetByCodeReturnsIcdCode(): void
    {
        $this->repo->method('findExactByCode')->willReturn($this->icdRow);

        $code = $this->service->getByCode('J06.9');

        $this->assertInstanceOf(IcdCode::class, $code);
        $this->assertSame('J069', $code->icd10index);
    }

    public function testGetByCodeThrows404WhenNotFound(): void
    {
        $this->repo->method('findExactByCode')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->service->getByCode('ZZZ.0');
    }

    public function testGetByCodeWithInvalidLanguageThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->getByCode('J06.9', 'fr');
    }
}
