<?php
/**
 * Test Utilities and Mock Helpers
 * 
 * This file contains utility functions and mock objects to help with testing
 * the REST API functions. It provides mock database connections, query builders,
 * and helper functions for common test scenarios.
 */

use PHPUnit\Framework\TestCase;

/**
 * Mock database connection with predictable behavior
 */
class MockDatabase
{
    private $queryResponses = [];
    private $queryCount = 0;
    private $lastQuery = '';
    private $lastError = null;
    
    public function __construct()
    {
        // Default responses for common queries
        $this->addQueryResponse('SELECT VERSION()', [
            'httpResponse' => 200,
            'data' => [['VERSION()' => '5.7.0']]
        ]);
    }
    
    public function addQueryResponse($pattern, $response)
    {
        $this->queryResponses[] = [
            'pattern' => $pattern,
            'response' => $response
        ];
    }
    
    public function query($sql)
    {
        $this->queryCount++;
        $this->lastQuery = $sql;
        
        // Find matching response
        foreach ($this->queryResponses as $queryResponse) {
            $pattern = '/' . str_replace('*', '.*', preg_quote($queryResponse['pattern'], '/')) . '/i';
            if (preg_match($pattern, $sql)) {
                $response = $queryResponse['response'];
                if (is_callable($response)) {
                    return $response($sql);
                } else {
                    return $this->createMockResult($response);
                }
            }
        }
        
        // No matching response found
        $this->lastError = 'No matching response for query: ' . $sql;
        return false;
    }
    
    public function error()
    {
        return $this->lastError;
    }
    
    public function getQueryCount()
    {
        return $this->queryCount;
    }
    
    public function getLastQuery()
    {
        return $this->lastQuery;
    }
    
    private function createMockResult($data)
    {
        $result = new stdClass();
        $result->num_rows = is_array($data) ? count($data) : (is_object($data) ? 1 : 0);
        $result->fetch_assoc = function() use (&$data) {
            if (is_array($data) && count($data) > 0) {
                return array_shift($data);
            }
            return null;
        };
        return $result;
    }
}

/**
 * Helper class for testing API request/response cycles
 */
class ApiTestHelper
{
    /**
     * Create a valid API request structure
     */
    public static function createRequest($data = [], $method = 'POST', $headers = [])
    {
        $_SERVER['REQUEST_METHOD'] = $method;
        $_SERVER['QUERY_STRING'] = http_build_query($data);
        
        // Simulate request data input
        $GLOBALS['_request_data'] = $data;
        
        // Mock getallheaders
        $GLOBALS['getallheaders'] = function() use ($headers) {
            return array_merge(['Content-Type' => 'application/json'], $headers);
        };
        
        return $data;
    }
    
    /**
     * Create a patient data set for testing
     */
    public static function createPatientData($overrides = [])
    {
        $defaults = [
            'clinicPatientID' => 'TEST' . rand(1000, 9999),
            'lastName' => 'TestLastName',
            'firstName' => 'TestFirstName',
            'sex' => 'Male',
            'birthDate' => '1990-01-01',
            'homeAddress1' => '123 Test St',
            'homeCity' => 'Test City',
            'contactPhone' => '555-1234'
        ];
        
        return array_merge($defaults, $overrides);
    }
    
    /**
     * Create a visit data set for testing
     */
    public static function createVisitData($overrides = [])
    {
        $defaults = [
            'clinicPatientID' => 'TEST0001',
            'visitType' => 'Routine',
            'primaryComplaint' => 'Annual checkup',
            'height' => 170,
            'heightUnits' => 'cm',
            'weight' => 70,
            'weightUnits' => 'kg',
            'bpSystolic' => 120,
            'bpDiastolic' => 80,
            'pulse' => 70,
            'temp' => 98.6,
            'tempUnits' => 'F'
        ];
        
        return array_merge($defaults, $overrides);
    }
    
    /**
     * Create a staff/user data set for testing
     */
    public static function createStaffData($overrides = [])
    {
        $defaults = [
            'username' => 'testuser' . rand(100, 999),
            'lastName' => 'TestStaff',
            'firstName' => 'Test',
            'password' => 'password123',
            'accessGranted' => 'Staff',
            'position' => 'Nurse',
            'contactInfo' => 'test@example.com',
            'active' => 1
        ];
        
        return array_merge($defaults, $overrides);
    }
    
    /**
     * Mock database records response
     */
    public static function createDbResponse($data, $httpResponse = 200, $count = null)
    {
        $response = [
            'httpResponse' => $httpResponse,
            'httpReason' => $httpResponse === 200 ? 'Success' : 'Error',
            'contentType' => 'application/json'
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
            $response['count'] = $count !== null ? $count : (is_array($data) ? count($data) : 1);
        } else {
            $response['count'] = 0;
        }
        
        return $response;
    }
    
    /**
     * Validate common API response structure
     */
    public static function validateApiResponse(TestCase $test, $response, $expectedStatus = 200)
    {
        $test->assertIsArray($response);
        $test->assertArrayHasKey('httpResponse', $response);
        $test->assertArrayHasKey('httpReason', $response);
        $test->assertArrayHasKey('contentType', $response);
        $test->assertEquals($expectedStatus, $response['httpResponse']);
        
        if (isset($response['data'])) {
            $test->assertArrayHasKey('count', $response);
        }
    }
}

/**
 * Mock security context for testing
 */
class MockSecurityContext
{
    private $defaultAccessLevel = 'Staff';
    private $validTokens = [];
    private $tokenSessions = [];
    
    public function __construct($defaultAccessLevel = 'Staff')
    {
        $this->defaultAccessLevel = $defaultAccessLevel;
    }
    
    public function addValidToken($token, $username = 'testuser', $accessLevel = null)
    {
        $this->validTokens[$token] = true;
        $this->tokenSessions[$token] = [
            'username' => $username,
            'accessGranted' => $accessLevel ?: $this->defaultAccessLevel,
            'sessionLanguage' => 'en',
            'sessionClinicPublicID' => 'CLINIC1',
            'loggedIn' => 1,
            'active' => 1
        ];
    }
    
    public function setupGlobalMocks()
    {
        // Mock token validation
        $GLOBALS['validTokenString'] = function($token) {
            return strlen($token) === 36 && preg_match('/^[0-9a-zA-Z_]+$/', $token);
        };
        
        // Mock token headers
        $GLOBALS['getTokenFromHeaders'] = function() {
            foreach ($_SERVER as $key => $value) {
                if ($key === 'HTTP_AUTHORIZATION' && stripos($value, 'Bearer ') === 0) {
                    return substr($value, 7);
                }
            }
            return $_GET['token'] ?? $_POST['token'] ?? null;
        };
        
        // Mock access checks
        $validTokens = $this->validTokens;
        $defaultAccessLevel = $this->defaultAccessLevel;
        $GLOBALS['checkUiSessionAccess'] = function($db, $token, $requiredLevel) use ($validTokens, $defaultAccessLevel) {
            if (!isset($validTokens[$token])) {
                return false;
            }
            
            // Simple access level hierarchy
            $accessLevels = [
                'Readonly' => 1,
                'Staff' => 2,
                'Clinic' => 3,
                'Admin' => 4,
                'SystemAdmin' => 5
            ];
            
            $userLevel = $accessLevels[$defaultAccessLevel] ?? 0;
            $required = $accessLevels[$requiredLevel] ?? 0;
            
            return $userLevel >= $required;
        };
        
        // Mock session info
        $tokenSessions = $this->tokenSessions;
        $GLOBALS['getSessionInfo'] = function($db, $token) use ($tokenSessions) {
            return $tokenSessions[$token] ?? null;
        };
    }
}

/**
 * Performance profiling mock for testing
 */
class MockProfiler
{
    private $checkpoints = [];
    private $startTime;
    
    public function start($data = [])
    {
        $this->startTime = microtime(true);
        $this->checkpoints = [];
        return $data;
    }
    
    public function checkpoint($name)
    {
        $this->checkpoints[$name] = microtime(true) - $this->startTime;
    }
    
    public function close($file, $args, $status = 'SUCCESS')
    {
        $endTime = microtime(true) - $this->startTime;
        return [
            'totalTime' => $endTime,
            'checkpoints' => $this->checkpoints,
            'file' => $file,
            'status' => $status
        ];
    }
    
    public function setupGlobalMocks()
    {
        $GLOBALS['profileLogStart'] = [$this, 'start'];
        $GLOBALS['profileLogCheckpoint'] = [$this, 'checkpoint'];
        $GLOBALS['profileLogClose'] = [$this, 'close'];
    }
}

/**
 * Mock logging system for testing
 */
class MockLogger
{
    private $logs = [];
    
    public function writeEntry($db, $logData)
    {
        $this->logs[] = array_merge([
            'timestamp' => date('Y-m-d H:i:s'),
            'logID' => count($this->logs) + 1
        ], $logData);
        
        return [
            'httpResponse' => 201,
            'httpReason' => 'Log entry created'
        ];
    }
    
    public function createEntry($class, $sourceModule, $table, $method, $token, $query, $headers, $before, $after, $status)
    {
        return [
            'logClass' => $class,
            'sourceModule' => $sourceModule,
            'logTable' => $table,
            'logAction' => $method,
            'userToken' => $token,
            'logQueryString' => $query,
            'logBeforeData' => $before,
            'logAfterData' => $after,
            'logStatusCode' => $status
        ];
    }
    
    public function getLogs()
    {
        return $this->logs;
    }
    
    public function clearLogs()
    {
        $this->logs = [];
    }
    
    public function setupGlobalMocks()
    {
        $GLOBALS['writeEntryToLog'] = [$this, 'writeEntry'];
        $GLOBALS['createLogEntry'] = [$this, 'createEntry'];
    }
}

/**
 * Test data factory for generating realistic test data
 */
class TestDataFactory
{
    private static $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
    private static $firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David'];
    private static $cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    private static $visitTypes = ['Routine', 'Emergency', 'Follow-up', 'Consultation'];
    private static $conditions = ['Hypertension', 'Diabetes', 'Asthma', 'Arthritis'];
    private static $icdCodes = [
        'I10' => 'Essential hypertension',
        'E11' => 'Type 2 diabetes mellitus',
        'J45' => 'Asthma',
        'M25' => 'Other joint disorder'
    ];
    
    public static function generatePatient($customData = [])
    {
        $randomLastName = self::$lastNames[array_rand(self::$lastNames)];
        $randomFirstName = self::$firstNames[array_rand(self::$firstNames)];
        $randomCity = self::$cities[array_rand(self::$cities)];
        
        $patient = [
            'clinicPatientID' => 'P' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'lastName' => $randomLastName,
            'firstName' => $randomFirstName,
            'sex' => rand(0, 1) ? 'Male' : 'Female',
            'birthDate' => date('Y-m-d', strtotime('-' . rand(20, 80) . ' years')),
            'homeAddress1' => rand(100, 999) . ' Main St',
            'homeCity' => $randomCity,
            'homeState' => 'CA',
            'contactPhone' => '555-' . rand(1000, 9999),
            'bloodType' => ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][rand(0, 7)]
        ];
        
        return array_merge($patient, $customData);
    }
    
    public static function generateVisit($patientID, $customData = [])
    {
        $visitType = self::$visitTypes[array_rand(self::$visitTypes)];
        $icdCode = array_rand(self::$icdCodes);
        
        $visit = [
            'clinicPatientID' => $patientID,
            'visitType' => $visitType,
            'primaryComplaint' => 'Patient reports ' . strtolower(self::$conditions[array_rand(self::$conditions)]),
            'diagnosis1' => $icdCode,
            'dateTimeIn' => date('Y-m-d H:i:s'),
            'height' => rand(150, 190),
            'heightUnits' => 'cm',
            'weight' => rand(50, 100),
            'weightUnits' => 'kg',
            'bpSystolic' => rand(100, 140),
            'bpDiastolic' => rand(60, 90),
            'pulse' => rand(60, 100),
            'temp' => rand(97, 99) + (rand(0, 9) / 10),
            'tempUnits' => 'F'
        ];
        
        return array_merge($visit, $customData);
    }
    
    public static function generateStaffMember($customData = [])
    {
        $lastName = self::$lastNames[array_rand(self::$lastNames)];
        $firstName = self::$firstNames[array_rand(self::$firstNames)];
        
        $staff = [
            'username' => strtolower($firstName . '.' . $lastName . rand(1, 99)),
            'lastName' => $lastName,
            'firstName' => $firstName,
            'password' => 'password123',
            'accessGranted' => ['Staff', 'Clinic', 'Admin'][rand(0, 2)],
            'position' => ['Nurse', 'Doctor', 'Administrator', 'Receptionist'][rand(0, 3)],
            'contactInfo' => strtolower($firstName . '.' . $lastName) . '@clinic.example.com',
            'active' => 1
        ];
        
        return array_merge($staff, $customData);
    }
    
    public static function generateIcdCode($language = 'en')
    {
        $codes = array_keys(self::$icdCodes);
        $code = $codes[array_rand($codes)];
        
        return [
            'icd10code' => $code,
            'icd10index' => $code,
            'shortDescription' => self::$icdCodes[$code],
            'language' => $language,
            'useCount' => rand(0, 100),
            'lastUsedDate' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 365) . ' days'))
        ];
    }
}

/**
 * Integration test scenario builder
 */
class IntegrationScenarioBuilder
{
    private $scenarios = [];
    private $mockDb;
    private $mockSecurity;
    
    public function __construct(MockDatabase $mockDb, MockSecurityContext $mockSecurity)
    {
        $this->mockDb = $mockDb;
        $this->mockSecurity = $mockSecurity;
    }
    
    public function addScenario($name, $steps)
    {
        $this->scenarios[$name] = $steps;
        return $this;
    }
    
    public function executeScenario($name, TestCase $test)
    {
        if (!isset($this->scenarios[$name])) {
            throw new Exception("Scenario '$name' not found");
        }
        
        $results = [];
        $steps = $this->scenarios[$name];
        
        foreach ($steps as $stepName => $step) {
            $context = [
                'mockDb' => $this->mockDb,
                'mockSecurity' => $this->mockSecurity,
                'previousResults' => $results,
                'test' => $test
            ];
            
            $results[$stepName] = $step($context);
        }
        
        return $results;
    }
    
    public static function createPatientWorkflowScenario()
    {
        return [
            'createPatient' => function($context) {
                $patientData = TestDataFactory::generatePatient();
                // Setup mock responses for patient creation
                $context['mockDb']->addQueryResponse(
                    'INSERT INTO `patient`',
                    ApiTestHelper::createDbResponse($patientData, 201)
                );
                // Execute patient creation
                require_once 'patient_post.php';
                return _patient_post($context['mockDb'], 'valid_token', $patientData);
            },
            'createVisit' => function($context) {
                $patientData = $context['previousResults']['createPatient']['data'];
                $visitData = TestDataFactory::generateVisit($patientData['clinicPatientID']);
                
                // Setup mock responses for visit creation
                $context['mockDb']->addQueryResponse(
                    'SELECT * FROM `patient`',
                    ApiTestHelper::createDbResponse($patientData)
                );
                
                require_once 'visit_post.php';
                return _visit_post($context['mockDb'], 'valid_token', $visitData);
            },
            'updateVisit' => function($context) {
                $visitData = $context['previousResults']['createVisit']['data'];
                $updateData = [
                    'visitID' => $visitData['visitID'] ?? 1,
                    'visitStatus' => 'Closed',
                    'diagnosis1' => 'I10'
                ];
                
                // Setup mock responses for visit update
                $context['mockDb']->addQueryResponse(
                    'SELECT * FROM `visit`',
                    ApiTestHelper::createDbResponse($visitData)
                );
                
                require_once 'visit_patch.php';
                return _visit_patch($context['mockDb'], 'valid_token', $updateData);
            }
        ];
    }
}

// Example usage function
function setupTestEnvironment()
{
    $mockDb = new MockDatabase();
    $mockSecurity = new MockSecurityContext();
    $mockProfiler = new MockProfiler();
    $mockLogger = new MockLogger();
    
    // Setup all global mocks
    $mockSecurity->setupGlobalMocks();
    $mockProfiler->setupGlobalMocks();
    $mockLogger->setupGlobalMocks();
    
    // Add some valid tokens
    $mockSecurity->addValidToken('valid_token', 'testuser', 'Staff');
    $mockSecurity->addValidToken('admin_token', 'admin', 'Admin');
    
    return [
        'db' => $mockDb,
        'security' => $mockSecurity,
        'profiler' => $mockProfiler,
        'logger' => $mockLogger
    ];
}
