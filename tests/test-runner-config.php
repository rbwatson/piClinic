<?php
/**
 * Test Runner and Configuration
 * 
 * This file sets up the test environment and runs all test suites.
 * It includes configuration for PHPUnit and helper functions for testing.
 */

require_once 'vendor/autoload.php';
require_once 'test-utilities.php';

/**
 * PHPUnit configuration (phpunit.xml equivalent in PHP)
 */
class PHPUnitConfiguration
{
    public static function configure()
    {
        $configuration = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<phpunit 
    bootstrap="bootstrap.php"
    colors="true"
    verbose="true"
    stopOnFailure="false"
    processIsolation="false"
    backupGlobals="false"
    backupStaticAttributes="false"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true"
>
    <testsuites>
        <testsuite name="API Tests">
            <file>./SessionApiTest.php</file>
            <file>./PatientApiTest.php</file>
            <file>./VisitApiTest.php</file>
            <file>./StaffApiTest.php</file>
            <file>./IcdApiTest.php</file>
            <file>./LogApiTest.php</file>
            <file>./CommentApiTest.php</file>
        </testsuite>
        
        <testsuite name="Security Tests">
            <file>./ApiSecurityTest.php</file>
        </testsuite>
        
        <testsuite name="Edge Case Tests">
            <file>./ApiEdgeCaseTest.php</file>
        </testsuite>
        
        <testsuite name="Data Validation Tests">
            <file>./ApiDataValidationTest.php</file>
        </testsuite>
        
        <testsuite name="Performance Tests">
            <file>./ApiPerformanceTest.php</file>
        </testsuite>
        
        <testsuite name="Integration Tests">
            <file>./ApiIntegrationTest.php</file>
        </testsuite>
    </testsuites>
    
    <logging>
        <log type="coverage-html" target="./coverage-html" lowUpperBound="35" highLowerBound="70"/>
        <log type="coverage-text" target="php://stdout" showUncoveredFiles="false"/>
        <log type="junit" target="./junit.xml"/>
    </logging>
    
    <php>
        <const name="PHPUNIT_RUNNING" value="true"/>
        <const name="TEST_DB_HOST" value="localhost"/>
        <const name="TEST_DB_NAME" value="test_database"/>
        <const name="TEST_DB_USER" value="test_user"/>
        <const name="TEST_DB_PASS" value="test_password"/>
    </php>
</phpunit>
XML;
        
        file_put_contents('phpunit.xml', $configuration);
    }
}

/**
 * Bootstrap file for test environment setup
 */
class TestBootstrap
{
    public static function run()
    {
        // Set up error reporting
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        
        // Set up timezone
        date_default_timezone_set('UTC');
        
        // Create test directories
        if (!file_exists('coverage-html')) {
            mkdir('coverage-html', 0777, true);
        }
        
        // Load test configuration
        self::loadTestConfig();
        
        // Set up database for integration tests
        self::setupTestDatabase();
        
        // Mock global functions for isolated testing
        self::setupGlobalMocks();
    }
    
    private static function loadTestConfig()
    {
        // Load test-specific configuration
        require_once 'config/test_config.php';
        
        // Override production constants for testing
        if (!defined('API_DEBUG_MODE')) {
            define('API_DEBUG_MODE', true);
        }
        
        if (!defined('DB_QUERY_LIMIT')) {
            define('DB_QUERY_LIMIT', ' LIMIT 100');
        }
        
        if (!defined('DB_QUERY_LIMIT_COUNT')) {
            define('DB_QUERY_LIMIT_COUNT', 100);
        }
    }
    
    private static function setupTestDatabase()
    {
        // Create a test database schema
        // This is only run for integration tests that need a real database
        if (getenv('RUN_INTEGRATION_TESTS') === 'true') {
            $db = new PDO(
                "mysql:host=" . TEST_DB_HOST,
                TEST_DB_USER,
                TEST_DB_PASS
            );
            
            // Create test database if not exists
            $db->exec("CREATE DATABASE IF NOT EXISTS " . TEST_DB_NAME);
            $db->exec("USE " . TEST_DB_NAME);
            
            // Create tables from schema file
            $schema = file_get_contents('sql/test_schema.sql');
            $db->exec($schema);
            
            // Insert test data
            $testData = file_get_contents('sql/test_data.sql');
            $db->exec($testData);
        }
    }
    
    private static function setupGlobalMocks()
    {
        // Mock $_SERVER superglobal
        $_SERVER['REQUEST_METHOD'] = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $_SERVER['REMOTE_ADDR'] = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $_SERVER['HTTP_USER_AGENT'] = $_SERVER['HTTP_USER_AGENT'] ?? 'PHPUnit Test Runner';
        $_SERVER['PHP_SELF'] = $_SERVER['PHP_SELF'] ?? '/test.php';
        $_SERVER['SCRIPT_NAME'] = $_SERVER['SCRIPT_NAME'] ?? '/test.php';
        $_SERVER['SERVER_ADDR'] = $_SERVER['SERVER_ADDR'] ?? '127.0.0.1';
        $_SERVER['SERVER_PORT'] = $_SERVER['SERVER_PORT'] ?? '80';
        
        // Mock exit function
        if (!function_exists('exit')) {
            function exit($status = 0) {
                throw new ExitException($status);
            }
        }
    }
}

/**
 * Custom exception for handling exit() calls in tests
 */
class ExitException extends Exception
{
    public function __construct($status = 0)
    {
        parent::__construct('Exit called with status: ' . $status, $status);
    }
}

/**
 * Test Report Generator
 */
class TestReportGenerator
{
    public static function generateReport($results)
    {
        $report = [
            'timestamp' => date('Y-m-d H:i:s'),
            'summary' => [
                'total_tests' => 0,
                'passed' => 0,
                'failed' => 0,
                'skipped' => 0,
                'errors' => 0
            ],
            'details' => []
        ];
        
        foreach ($results as $suite => $tests) {
            $report['details'][$suite] = [];
            
            foreach ($tests as $test => $result) {
                $report['summary']['total_tests']++;
                
                switch ($result['status']) {
                    case 'passed':
                        $report['summary']['passed']++;
                        break;
                    case 'failed':
                        $report['summary']['failed']++;
                        break;
                    case 'skipped':
                        $report['summary']['skipped']++;
                        break;
                    case 'error':
                        $report['summary']['errors']++;
                        break;
                }
                
                $report['details'][$suite][$test] = $result;
            }
        }
        
        // Generate HTML report
        self::generateHtmlReport($report);
        
        // Generate JSON report
        file_put_contents('test-report.json', json_encode($report, JSON_PRETTY_PRINT));
        
        return $report;
    }
    
    private static function generateHtmlReport($report)
    {
        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        .passed { color: green; }
        .failed { color: red; }
        .error { color: orange; }
        .skipped { color: blue; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .suite-header { background-color: #e8e8e8; font-weight: bold; }
    </style>
</head>
<body>
    <h1>API Test Report</h1>
    <p>Generated: {$report['timestamp']}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: {$report['summary']['total_tests']}</p>
        <p class="passed">Passed: {$report['summary']['passed']}</p>
        <p class="failed">Failed: {$report['summary']['failed']}</p>
        <p class="error">Errors: {$report['summary']['errors']}</p>
        <p class="skipped">Skipped: {$report['summary']['skipped']}</p>
    </div>
    
    <h2>Detailed Results</h2>
    <table>
        <thead>
            <tr>
                <th>Test Suite</th>
                <th>Test Name</th>
                <th>Status</th>
                <th>Execution Time</th>
                <th>Message</th>
            </tr>
        </thead>
        <tbody>
HTML;
        
        foreach ($report['details'] as $suite => $tests) {
            $html .= "<tr class='suite-header'><td colspan='5'>$suite</td></tr>";
            
            foreach ($tests as $test => $result) {
                $statusClass = $result['status'];
                $time = number_format($result['time'], 3) . 's';
                $message = htmlspecialchars($result['message'] ?? '');
                
                $html .= <<<HTML
                <tr>
                    <td></td>
                    <td>$test</td>
                    <td class="$statusClass">{$result['status']}</td>
                    <td>$time</td>
                    <td>$message</td>
                </tr>
HTML;
            }
        }
        
        $html .= <<<HTML
        </tbody>
    </table>
</body>
</html>
HTML;
        
        file_put_contents('test-report.html', $html);
    }
}

/**
 * Main test runner
 */
class ApiTestRunner
{
    public static function run()
    {
        // Initialize test environment
        TestBootstrap::run();
        
        // Generate PHPUnit configuration
        PHPUnitConfiguration::configure();
        
        echo "Starting API Test Suite...\n\n";
        
        // Run tests
        $command = 'vendor/bin/phpunit --configuration phpunit.xml';
        
        if (getenv('GENERATE_COVERAGE') === 'true') {
            $command .= ' --coverage-html coverage-html';
        }
        
        system($command, $returnVar);
        
        // Generate custom report
        if (file_exists('junit.xml')) {
            $results = self::parseJUnitXml('junit.xml');
            $report = TestReportGenerator::generateReport($results);
            
            echo "\n\nTest report generated at test-report.html\n";
            
            if ($report['summary']['failed'] > 0 || $report['summary']['errors'] > 0) {
                echo "\n❌ SOME TESTS FAILED\n";
                echo "Failed: {$report['summary']['failed']}\n";
                echo "Errors: {$report['summary']['errors']}\n";
                exit(1);
            } else {
                echo "\n✅ ALL TESTS PASSED\n";
                exit(0);
            }
        }
        
        exit($returnVar);
    }
    
    private static function parseJUnitXml($file)
    {
        $xml = simplexml_load_file($file);
        $results = [];
        
        foreach ($xml->testsuite as $suite) {
            $suiteName = (string)$suite['name'];
            $results[$suiteName] = [];
            
            foreach ($suite->testcase as $testcase) {
                $testName = (string)$testcase['name'];
                $time = (float)$testcase['time'];
                
                $status = 'passed';
                $message = '';
                
                if (isset($testcase->failure)) {
                    $status = 'failed';
                    $message = (string)$testcase->failure;
                } elseif (isset($testcase->error)) {
                    $status = 'error';
                    $message = (string)$testcase->error;
                } elseif (isset($testcase->skipped)) {
                    $status = 'skipped';
                    $message = (string)$testcase->skipped;
                }
                
                $results[$suiteName][$testName] = [
                    'status' => $status,
                    'time' => $time,
                    'message' => $message
                ];
            }
        }
        
        return $results;
    }
}

// Run the test suite
if (php_sapi_name() === 'cli') {
    ApiTestRunner::run();
}
