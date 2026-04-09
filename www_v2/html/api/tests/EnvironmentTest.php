<?php

declare(strict_types=1);

namespace piClinic\Tests;

use PHPUnit\Framework\TestCase;

/**
 * EnvironmentTest
 *
 * Placeholder test suite that verifies the basic PHP environment and
 * required extensions are present. Replace or extend with real tests
 * as the v2 API is developed.
 */
class EnvironmentTest extends TestCase
{
    public function testPhpVersionMeetsMinimum(): void
    {
        $this->assertGreaterThanOrEqual(
            80400,
            PHP_VERSION_ID,
            'PHP 8.4+ is required. Current version: ' . PHP_VERSION
        );
    }

    public function testRequiredExtensionsLoaded(): void
    {
        $required = ['pdo', 'pdo_mysql', 'mbstring', 'xml', 'curl', 'zip', 'intl', 'bcmath'];
        foreach ($required as $ext) {
            $this->assertTrue(
                extension_loaded($ext),
                "Required PHP extension not loaded: $ext"
            );
        }
    }

    public function testComposerAutoloadWorks(): void
    {
        // If we got here, the autoloader loaded successfully.
        $this->assertTrue(true);
    }
}
