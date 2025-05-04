<?php
/**
 * Unit tests for REST API functions
 * 
 * These tests use PHPUnit to test the REST endpoints and their associated functions.
 * Each endpoint (session, patient, visit, etc.) has its own test class.
 */

use PHPUnit\Framework\TestCase;

// Base test class for API endpoints
abstract class ApiTestBase extends TestCase
{
    protected $dbMock;
    protected $validToken = '12345678_1234_1234_1234_123456789012';
    
    protected function setUp(): void
    {
        parent::setUp();
        // Mock database connection
        $this->dbMock = $this->createMock(mysqli::class);
        
        // Mock global functions
        $this->setUpGlobalMocks();
    }
    
    protected function setUpGlobalMocks()
    {
        // Mock database operations
        $GLOBALS['_openDBforAPI'] = function() {
            return $this->dbMock;
        };
        
        // Mock token validation
        $GLOBALS['validTokenString'] = function($token) {
            return strlen($token) === 36 && preg_match('/^[0-9a-zA-Z_]+$/', $token);
        };
        
        // Mock logging functions
        $GLOBALS['writeEntryToLog'] = function() {};
        $GLOBALS['profileLogStart'] = function() {};
        $GLOBALS['profileLogClose'] = function() {};
        $GLOBALS['profileLogCheckpoint'] = function() {};
        
        // Mock security checks
        $GLOBALS['checkUiSessionAccess'] = function($db, $token, $level) {
            return true; // Default to allowing access for tests
        };
    }
    
    protected function assertValidApiResponse($response, $expectedStatus = 200)
    {
        $this->assertIsArray($response);
        $this->assertArrayHasKey('httpResponse', $response);
        $this->assertArrayHasKey('httpReason', $response);
        $this->assertEquals($expectedStatus, $response['httpResponse']);
    }
}

// Test Session API
class SessionApiTest extends ApiTestBase
{
    public function testSessionPostSuccess()
    {
        // Arrange
        $requestArgs = [
            'username' => 'testuser',
            'password' => 'password123'
        ];
        
        // Mock database response for user lookup
        $userResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'username' => 'testuser',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'active' => 1,
                'staffID' => 1,
                'accessGranted' => 'Staff',
                'preferredLanguage' => 'en',
                'preferredClinicPublicID' => 'CLINIC1'
            ]
        ];
        
        // Mock getDbRecords function
        $GLOBALS['getDbRecords'] = function($db, $query) use ($userResponse) {
            if (strpos($query, 'DB_TABLE_STAFF') !== false) {
                return $userResponse;
            }
            return ['httpResponse' => 404];
        };
        
        // Mock mysqli_query for session insert
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'session_post.php';
        $result = _session_post($this->dbMock, null, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 201);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('token', $result['data']);
        $this->assertNotEmpty($result['data']['token']);
    }
    
    public function testSessionPostInvalidPassword()
    {
        // Arrange
        $requestArgs = [
            'username' => 'testuser',
            'password' => 'wrongpassword'
        ];
        
        $userResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'username' => 'testuser',
                'password' => password_hash('correctpassword', PASSWORD_DEFAULT),
                'active' => 1
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($userResponse) {
            return $userResponse;
        };
        
        // Act
        require_once 'session_post.php';
        $result = _session_post($this->dbMock, null, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 401);
        $this->assertEquals('Password does not match the password saved for this user.', $result['httpReason']);
    }
    
    public function testSessionGetValid()
    {
        // Arrange
        $token = $this->validToken;
        $requestArgs = [];
        
        $sessionResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'token' => $token,
                'username' => 'testuser',
                'accessGranted' => 'Staff',
                'sessionLanguage' => 'en',
                'sessionClinicPublicID' => 'CLINIC1',
                'loggedIn' => 1,
                'sessionIP' => '127.0.0.1',
                'sessionUA' => 'test-browser',
                'expiresOnDate' => '2030-01-01 00:00:00' // Future date
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($sessionResponse) {
            return $sessionResponse;
        };
        
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
        $_SERVER['HTTP_USER_AGENT'] = 'test-browser';
        
        // Act
        require_once 'session_get.php';
        $result = _session_get($this->dbMock, $token, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals($token, $result['data']['token']);
        $this->assertEquals('testuser', $result['data']['username']);
    }
    
    public function testSessionDelete()
    {
        // Arrange
        $token = $this->validToken;
        $requestArgs = [];
        
        $sessionResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'token' => $token,
                'loggedIn' => 1
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($sessionResponse) {
            return $sessionResponse;
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'session_delete.php';
        $result = _session_delete($this->dbMock, $token, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals('User session deleted.', $result['httpReason']);
    }
}

// Test Patient API
class PatientApiTest extends ApiTestBase
{
    public function testPatientPostSuccess()
    {
        // Arrange
        $requestArgs = [
            'clinicPatientID' => 'TEST001',
            'lastName' => 'Smith',
            'firstName' => 'John',
            'sex' => 'Male',
            'birthDate' => '1990-01-01'
        ];
        
        // Mock success response for patient creation
        $createResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => array_merge($requestArgs, ['patientID' => 1])
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($createResponse) {
            return $createResponse;
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'patient_post.php';
        $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 201);
        $this->assertEquals('TEST001', $result['data']['clinicPatientID']);
    }
    
    public function testPatientPostMissingRequired()
    {
        // Arrange
        $requestArgs = [
            'clinicPatientID' => 'TEST001'
            // Missing lastName, firstName, sex, birthDate
        ];
        
        // Act
        require_once 'patient_post.php';
        $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 400);
        $this->assertStringContainsString('Required patient record field(s)', $result['httpReason']);
    }
    
    public function testPatientGetById()
    {
        // Arrange
        $requestArgs = ['clinicPatientID' => 'TEST001'];
        
        $patientResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'clinicPatientID' => 'TEST001',
                'lastName' => 'Smith',
                'firstName' => 'John',
                'sex' => 'Male',
                'birthDate' => '1990-01-01'
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($patientResponse) {
            return $patientResponse;
        };
        
        // Act
        require_once 'patient_get.php';
        $result = _patient_get($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals('TEST001', $result['data']['clinicPatientID']);
    }
    
    public function testPatientPatch()
    {
        // Arrange
        $requestArgs = [
            'clinicPatientID' => 'TEST001',
            'contactPhone' => '555-1234'
        ];
        
        // Mock existing patient
        $currentPatient = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'clinicPatientID' => 'TEST001',
                'lastName' => 'Smith',
                'firstName' => 'John'
            ]
        ];
        
        // Mock updated patient
        $updatedPatient = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => array_merge($currentPatient['data'], ['contactPhone' => '555-1234'])
        ];
        
        $calls = 0;
        $GLOBALS['getDbRecords'] = function($db, $query) use (&$calls, $currentPatient, $updatedPatient) {
            $calls++;
            return $calls === 1 ? $currentPatient : $updatedPatient;
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'patient_patch.php';
        $result = _patient_patch($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals('555-1234', $result['data']['contactPhone']);
    }
}

// Test Visit API
class VisitApiTest extends ApiTestBase
{
    public function testVisitPostSuccess()
    {
        // Arrange
        $requestArgs = [
            'clinicPatientID' => 'TEST001',
            'visitType' => 'CheckUp'
        ];
        
        // Mock patient lookup
        $patientResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'clinicPatientID' => 'TEST001',
                'patientID' => 1,
                'lastName' => 'Smith',
                'firstName' => 'John',
                'sex' => 'Male',
                'birthDate' => '1990-01-01'
            ]
        ];
        
        // Mock visit check (no existing visits today)
        $noVisitsResponse = [
            'httpResponse' => 200,
            'count' => 0,
            'data' => []
        ];
        
        // Mock visit creation success
        $visitResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'patientVisitID' => '000000000001' . date('Ymd') . '01',
                'clinicPatientID' => 'TEST001',
                'visitType' => 'CheckUp'
            ]
        ];
        
        $calls = 0;
        $GLOBALS['getDbRecords'] = function($db, $query) use (&$calls, $patientResponse, $noVisitsResponse, $visitResponse) {
            $calls++;
            if ($calls === 1) return $patientResponse;
            if ($calls === 2) return $noVisitsResponse;
            return $visitResponse;
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'visit_post.php';
        $result = _visit_post($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 201);
        $this->assertEquals('CheckUp', $result['data']['visitType']);
        $this->assertArrayHasKey('patientVisitID', $result['data']);
    }
    
    public function testVisitGetById()
    {
        // Arrange
        $requestArgs = ['visitID' => '123'];
        
        $visitResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'visitID' => '123',
                'clinicPatientID' => 'TEST001',
                'visitType' => 'CheckUp',
                'visitStatus' => 'Open'
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($visitResponse) {
            return $visitResponse;
        };
        
        // Act
        require_once 'visit_get.php';
        $result = _visit_get($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals('123', $result['data']['visitID']);
        $this->assertEquals('Open', $result['data']['visitStatus']);
    }
}

// Test Staff API
class StaffApiTest extends ApiTestBase
{
    public function testStaffPostSuccess()
    {
        // Arrange
        $requestArgs = [
            'username' => 'newstaff',
            'lastName' => 'Johnson',
            'firstName' => 'Jane',
            'password' => 'password123',
            'accessGranted' => 'Staff'
        ];
        
        $staffResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'username' => 'newstaff',
                'lastName' => 'Johnson',
                'firstName' => 'Jane',
                'accessGranted' => 'Staff',
                'staffID' => 10
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($staffResponse) {
            return $staffResponse;
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'staff_post.php';
        $result = _staff_post($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 201);
        $this->assertEquals('newstaff', $result['data']['username']);
        // Password should be hashed
        $this->assertArrayNotHasKey('password', $result['data']);
    }
    
    public function testStaffGetByUsername()
    {
        // Arrange
        $requestArgs = ['username' => 'testuser'];
        
        $staffResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'username' => 'testuser',
                'lastName' => 'Smith',
                'firstName' => 'John',
                'accessGranted' => 'Staff',
                'active' => 1
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($staffResponse) {
            return $staffResponse;
        };
        
        // Act
        require_once 'staff_get.php';
        $result = _staff_get($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals('testuser', $result['data']['username']);
    }
}

// Test API Common Functions
class ApiCommonTest extends ApiTestBase
{
    public function testValidTokenString()
    {
        // Arrange
        require_once 'api_common.php';
        
        // Test valid tokens
        $validToken1 = '12345678_1234_1234_1234_123456789012';
        $validToken2 = 'ABCDEF12_ABCD_ABCD_ABCD_ABCDEF123456';
        
        // Test invalid tokens
        $invalidToken1 = '123'; // Too short
        $invalidToken2 = '12345678_1234_1234_1234_123456789012X'; // Invalid length
        $invalidToken3 = '12345678.1234.1234.1234.123456789012'; // Wrong separator
        $invalidToken4 = '12345678_1234_1234_1234!123456789012'; // Invalid character
        
        // Act & Assert
        $this->assertTrue(validTokenString($validToken1));
        $this->assertTrue(validTokenString($validToken2));
        $this->assertFalse(validTokenString($invalidToken1));
        $this->assertFalse(validTokenString($invalidToken2));
        $this->assertFalse(validTokenString($invalidToken3));
        $this->assertFalse(validTokenString($invalidToken4));
    }
    
    public function testGuidString()
    {
        // Arrange
        require_once 'api_common.php';
        
        // Act
        $guid1 = guidString();
        $guid2 = guidString('_');
        $guid3 = guidString('');
        
        // Assert
        $this->assertIsString($guid1);
        $this->assertEquals(36, strlen($guid1));
        $this->assertStringContainsString('-', $guid1);
        $this->assertStringContainsString('_', $guid2);
        $this->assertStringNotContainsString('-', $guid3);
        $this->assertStringNotContainsString('_', $guid3);
        $this->assertNotEquals($guid1, guidString()); // Should be unique
    }
    
    public function testFormatMissingTokenError()
    {
        // Arrange
        require_once 'api_common.php';
        $returnValue = [];
        $actionName = 'test-action';
        
        // Act
        $result = formatMissingTokenError($returnValue, $actionName);
        
        // Assert
        $this->assertIsArray($result);
        $this->assertEquals(400, $result['httpResponse']);
        $this->assertStringContainsString('test-action', $result['httpReason']);
        $this->assertStringContainsString('Missing token', $result['httpReason']);
    }
}

// Test ICD Functionality
class IcdApiTest extends ApiTestBase
{
    public function testIcdGetByCode()
    {
        // Arrange
        $requestArgs = [
            'ce' => 'I10',
            'language' => 'en'
        ];
        
        $icdResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'icd10code' => 'I10',
                'icd10index' => 'I10',
                'shortDescription' => 'Essential (primary) hypertension',
                'language' => 'en'
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($icdResponse) {
            return $icdResponse;
        };
        
        // Act
        require_once 'icd_get.php';
        $result = _icd_get($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals('I10', $result['data']['icd10code']);
        $this->assertEquals('Essential (primary) hypertension', $result['data']['shortDescription']);
    }
    
    public function testIcdPatch()
    {
        // Arrange
        $requestArgs = [
            'icd10index' => 'I10',
            'language' => 'en'
        ];
        
        // Mock successful update
        $updateResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'icd10index' => 'I10',
                'useCount' => 2,
                'lastUsedDate' => date('Y-m-d H:i:s')
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($updateResponse) {
            return $updateResponse;
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'icd_patch.php';
        $result = _icd_patch($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals('I10', $result['data']['icd10index']);
        $this->assertArrayHasKey('lastUsedDate', $result['data']);
    }
}

// Test Log API
class LogApiTest extends ApiTestBase
{
    public function testLogPost()
    {
        // Arrange
        $requestArgs = [
            'sourceModule' => 'test.php',
            'logClass' => 'API',
            'logTable' => 'test',
            'logAction' => 'test'
        ];
        
        // Mock writeEntryToLog returning success
        $GLOBALS['writeEntryToLog'] = function($db, $logData) {
            return [
                'httpResponse' => 201,
                'httpReason' => 'Log entry created'
            ];
        };
        
        // Act
        require_once 'log_post.php';
        $result = _log_post($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 201);
        $this->assertEquals('Log entry created', $result['httpReason']);
    }
    
    public function testLogGet()
    {
        // Arrange
        $requestArgs = ['sourceModule' => 'test.php'];
        
        $logResponse = [
            'httpResponse' => 200,
            'count' => 2,
            'data' => [
                [
                    'logID' => 1,
                    'sourceModule' => 'test.php',
                    'logClass' => 'API',
                    'logStatusCode' => 200
                ],
                [
                    'logID' => 2,
                    'sourceModule' => 'test.php',
                    'logClass' => 'API',
                    'logStatusCode' => 404
                ]
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($logResponse) {
            return $logResponse;
        };
        
        // Act
        require_once 'log_get.php';
        $result = _log_get($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result);
        $this->assertEquals(2, $result['count']);
        $this->assertEquals('test.php', $result['data'][0]['sourceModule']);
    }
}

// Test Comment API
class CommentApiTest extends ApiTestBase
{
    public function testCommentPost()
    {
        // Arrange
        $requestArgs = [
            'username' => 'testuser',
            'commentText' => 'Test comment',
            'referringPage' => '/test-page'
        ];
        
        $commentResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'commentID' => 1,
                'username' => 'testuser',
                'commentText' => 'Test comment',
                'commentDate' => date('Y-m-d H:i:s')
            ]
        ];
        
        $GLOBALS['getDbRecords'] = function($db, $query) use ($commentResponse) {
            return $commentResponse;
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Act
        require_once 'comment_post.php';
        $result = _comment_post($this->dbMock, $this->validToken, $requestArgs);
        
        // Assert
        $this->assertValidApiResponse($result, 201);
        $this->assertEquals('testuser', $result['data']['username']);
        $this->assertEquals('Test comment', $result['data']['commentText']);
    }
}

// Integration Test Example
class ApiIntegrationTest extends ApiTestBase
{
    /**
     * Test a complete workflow: Create patient, create visit, update visit
     */
    public function testPatientVisitWorkflow()
    {
        // 1. Create patient
        $patientArgs = [
            'clinicPatientID' => 'INT001',
            'lastName' => 'Integration',
            'firstName' => 'Test',
            'sex' => 'Female',
            'birthDate' => '1985-05-15'
        ];
        
        $patientResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => array_merge($patientArgs, ['patientID' => 100])
        ];
        
        // 2. Create visit
        $visitArgs = [
            'clinicPatientID' => 'INT001',
            'visitType' => 'Annual'
        ];
        
        $visitResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => [
                'patientVisitID' => '000000000100' . date('Ymd') . '01',
                'clinicPatientID' => 'INT001',
                'visitType' => 'Annual',
                'visitStatus' => 'Open'
            ]
        ];
        
        // 3. Update visit
        $visitUpdateArgs = [
            'patientVisitID' => '000000000100' . date('Ymd') . '01',
            'visitStatus' => 'Closed',
            'diagnosis1' => 'I10',
            'weight' => 70,
            'weightUnits' => 'kg'
        ];
        
        $visitUpdateResponse = [
            'httpResponse' => 200,
            'count' => 1,
            'data' => array_merge($visitResponse['data'], [
                'visitStatus' => 'Closed',
                'diagnosis1' => 'I10',
                'weight' => 70,
                'weightUnits' => 'kg'
            ])
        ];
        
        // Mock database interactions in order
        $callCount = 0;
        $GLOBALS['getDbRecords'] = function($db, $query) use (
            &$callCount, 
            $patientResponse, 
            $visitResponse, 
            $visitUpdateResponse
        ) {
            $callCount++;
            
            // Patient creation query
            if ($callCount === 1) return $patientResponse;
            
            // Patient lookup for visit creation
            if ($callCount === 2) return $patientResponse;
            
            // Visit check (no existing visits)
            if ($callCount === 3) return ['httpResponse' => 200, 'count' => 0];
            
            // Visit creation query
            if ($callCount === 4) return $visitResponse;
            
            // Visit update lookup
            if ($callCount === 5) return $visitResponse;
            
            // Visit update result
            if ($callCount === 6) return $visitUpdateResponse;
            
            return ['httpResponse' => 404];
        };
        
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        // Execute workflow
        require_once 'patient_post.php';
        require_once 'visit_post.php';
        require_once 'visit_patch.php';
        
        // 1. Create patient
        $patientResult = _patient_post($this->dbMock, $this->validToken, $patientArgs);
        $this->assertValidApiResponse($patientResult, 201);
        
        // 2. Create visit
        $visitResult = _visit_post($this->dbMock, $this->validToken, $visitArgs);
        $this->assertValidApiResponse($visitResult, 201);
        
        // 3. Update visit
        $updateResult = _visit_patch($this->dbMock, $this->validToken, $visitUpdateArgs);
        $this->assertValidApiResponse($updateResult);
        $this->assertEquals('Closed', $updateResult['data']['visitStatus']);
        $this->assertEquals('I10', $updateResult['data']['diagnosis1']);
        $this->assertEquals(70, $updateResult['data']['weight']);
    }
}
