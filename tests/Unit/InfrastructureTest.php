<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit;

use PHPUnit\Framework\TestCase;
use PiClinic\Config\Database;
use PiClinic\Controllers\BaseController;
use PiClinic\Exceptions\HttpException;
use PiClinic\Middleware\AuthMiddleware;
use PiClinic\Middleware\CorsMiddleware;
use PiClinic\Middleware\LoggerMiddleware;
use PiClinic\Repositories\BaseRepository;

/**
 * Verifies that Phase 1A infrastructure classes are autoloaded correctly
 * and have the expected structure.
 */
class InfrastructureTest extends TestCase
{
    public function testCoreClassesExist(): void
    {
        $this->assertTrue(class_exists(Database::class));
        $this->assertTrue(class_exists(BaseController::class));
        $this->assertTrue(class_exists(BaseRepository::class));
        $this->assertTrue(class_exists(HttpException::class));
        $this->assertTrue(class_exists(AuthMiddleware::class));
        $this->assertTrue(class_exists(CorsMiddleware::class));
        $this->assertTrue(class_exists(LoggerMiddleware::class));
    }

    public function testHttpExceptionCarriesStatusCode(): void
    {
        $e = new HttpException(422, 'Unprocessable entity');

        $this->assertSame(422, $e->getStatusCode());
        $this->assertSame('Unprocessable entity', $e->getMessage());
    }

    public function testBaseControllerIsAbstract(): void
    {
        $reflection = new \ReflectionClass(BaseController::class);
        $this->assertTrue($reflection->isAbstract());
    }

    public function testBaseRepositoryIsAbstract(): void
    {
        $reflection = new \ReflectionClass(BaseRepository::class);
        $this->assertTrue($reflection->isAbstract());
    }
}
