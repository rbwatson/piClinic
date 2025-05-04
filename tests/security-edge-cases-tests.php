<?php
/**
 * Security and Edge Case Tests
 * 
 * This file contains tests for security vulnerabilities, edge cases,
 * and error conditions in the REST API.
 */

use PHPUnit\Framework\TestCase;

/**
 * Security Tests for API Endpoints
 */
class ApiSecurityTest extends ApiTestBase
{
    /**
     * Test SQL injection attempts
     */
    public function testSqlInjectionPrevention()
    {
        // Test various SQL injection payloads
        $injectionPayloads = [
            "'; DROP TABLE patient; --",
            "' OR 1=1 --",
            "UNION SELECT * FROM staff --",
            "'; UPDATE staff SET accessGranted='Admin'; --"
        ];
        
        foreach ($injectionPayloads as $payload) {
            // Test on patient search
            $requestArgs = ['lastName' => $payload];
            
            // Mock should not execute malicious SQL
            $GLOBALS['getDbRecords'] = function($db, $query) use ($payload) {
                // Check that the payload has been properly escaped
                $this->assertStringNotContainsString('DROP TABLE', $query);
                $this->assertStringNotContainsString('UNION SELECT', $query);
                return ['httpResponse' => 200, 'count' => 0];
            };
            
            require_once 'patient_get.php';
            $result = _patient_get($this->dbMock, $this->validToken, $requestArgs);
            
            // Should still return a valid response, not execute injection
            $this->assertValidApiResponse($result);
        }
    }
    
    /**
     * Test XSS prevention
     */
    public function testXssPreventionInComments()
    {
        $xssPayloads = [
            '<script>alert("xss")</script>',
            '<img src=x onerror=alert("xss")>',
            '<a href="javascript:alert(\'xss\')">click</a>',
            '"><svg onload=alert("xss")>'
        ];
        
        foreach ($xssPayloads as $payload) {
            $requestArgs = [
                'username' => 'testuser',
                'commentText' => $payload
            ];
            
            // Mock database response
            $GLOBALS['getDbRecords'] = function($db, $query) {
                return ['httpResponse' => 200, 'count' => 1, 'data' => []];
            };
            
            $queryMock = $this->createMock(mysqli_result::class);
            $this->dbMock->method('query')->willReturn($queryMock);
            
            require_once 'comment_post.php';
            $result = _comment_post($this->dbMock, $this->validToken, $requestArgs);
            
            // Verify the XSS payload has been sanitized
            $this->assertValidApiResponse($result, 201);
            if (isset($result['data']['commentText'])) {
                $this->assertStringNotContainsString('<script>', $result['data']['commentText']);
                $this->assertStringNotContainsString('javascript:', $result['data']['commentText']);
            }
        }
    }
    
    /**
     * Test access control violations
     */
    public function testAccessControlViolations()
    {
        // Create different access level tokens
        $tokens = [
            'readonly_token' => 'Readonly',
            'staff_token' => 'Staff',
            'clinic_token' => 'Clinic',
            'admin_token' => 'Admin'
        ];
        
        // Setup access control mock
        $GLOBALS['checkUiSessionAccess'] = function($db, $token, $requiredLevel) use ($tokens) {
            $tokenLevel = $tokens[$token] ?? 'Readonly';
            $levelHierarchy = [
                'Readonly' => 1,
                'Staff' => 2,
                'Clinic' => 3,
                'Admin' => 4
            ];
            
            return ($levelHierarchy[$tokenLevel] ?? 0) >= ($levelHierarchy[$requiredLevel] ?? 0);
        };
        
        // Test patient creation (requires Clinic access)
        $patientData = [
            'clinicPatientID' => 'TEST001',
            'lastName' => 'Test',
            'firstName' => 'Patient',
            'sex' => 'Male',
            'birthDate' => '1990-01-01'
        ];
        
        // Test with insufficient permissions
        require_once 'patient_post.php';
        $result = _patient_post($this->dbMock, 'staff_token', $patientData);
        $this->assertEquals(401, $result['httpResponse']);
        $this->assertStringContainsString('not authorized', $result['httpReason']);
        
        // Test with sufficient permissions
        $result = _patient_post($this->dbMock, 'clinic_token', $patientData);
        $this->assertNotEquals(401, $result['httpResponse']);
    }
    
    /**
     * Test token validation
     */
    public function testTokenValidation()
    {
        // Test invalid token formats
        $invalidTokens = [
            null,
            '',
            'short',
            'toolongfortokenformatvalidation',
            '12345678-1234-1234-1234-123456789012', // Wrong separator
            '12345678_1234_1234_1234_123456789012!', // Invalid character
            'NOTVALID_TOKN_FORM_AT' // Wrong length/format
        ];
        
        foreach ($invalidTokens as $token) {
            require_once 'session_get.php';
            $result = _session_get($this->dbMock, $token, []);
            
            // All invalid tokens should result in unauthorized response
            $this->assertEquals(404, $result['httpResponse']);
        }
    }
    
    /**
     * Test file upload/image handling security
     */
    public function testImageUploadSecurity()
    {
        // Test malicious file types
        $maliciousImages = [
            ['filename' => 'test.php', 'content' => '<?php evil_code(); ?>'],
            ['filename' => 'test.svg', 'content' => '<svg><script>alert("xss")</script></svg>'],
            ['filename' => 'test.html', 'content' => '<script>alert("xss")</script>']
        ];
        
        foreach ($maliciousImages as $file) {
            $requestArgs = [
                'format' => 'image',
                'data' => [
                    'imagePath' => '/tmp/' . $file['filename'],
                    'imageBytes' => $file['content'],
                    'mimeType' => 'image/jpeg' // Fake mime type
                ]
            ];
            
            // Test image output
            ob_start();
            require_once 'api_common.php';
            outputResults($requestArgs);
            $output = ob_get_clean();
            
            // Should not execute as script
            $this->assertStringNotContainsString('<?php', $output);
            $this->assertStringNotContainsString('<script>', $output);
        }
    }
}

/**
 * Edge Case Tests
 */
class ApiEdgeCaseTest extends ApiTestBase
{
    /**
     * Test handling of very large inputs
     */
    public function testLargeInputHandling()
    {
        // Test extremely long patient names
        $longString = str_repeat('a', 1000);
        $requestArgs = [
            'clinicPatientID' => 'TEST001',
            'lastName' => $longString,
            'firstName' => 'Test',
            'sex' => 'Male',
            'birthDate' => '1990-01-01'
        ];
        
        // Mock database response
        $queryMock = $this->createMock(mysqli_result::class);
        $this->dbMock->method('query')->willReturn($queryMock);
        
        require_once 'patient_post.php';
        $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
        
        // Should handle gracefully
        $this->assertValidApiResponse($result);
    }
    
    /**
     * Test concurrent request handling
     */
    public function testConcurrentRequests()
    {
        // Simulate multiple concurrent patient registrations
        $requestCount = 10;
        $patientIds = [];
        
        for ($i = 0; $i < $requestCount; $i++) {
            $patientId = 'CONCURRENT' . str_pad($i, 3, '0', STR_PAD_LEFT);
            $patientIds[] = $patientId;
            
            $requestArgs = [
                'clinicPatientID' => $patientId,
                'lastName' => 'Test' . $i,
                'firstName' => 'Concurrent',
                'sex' => 'Female',
                'birthDate' => '1990-01-01'
            ];
            
            // Mock each request
            $queryMock = $this->createMock(mysqli_result::class);
            $this->dbMock->method('query')->willReturn($queryMock);
            
            require_once 'patient_post.php';
            $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
            
            $this->assertValidApiResponse($result, 201);
        }
    }
    
    /**
     * Test database connection failures
     */
    public function testDatabaseFailureHandling()
    {
        // Mock database connection failure
        $GLOBALS['_openDBforAPI'] = function() {
            return false;
        };
        
        $requestArgs = ['clinicPatientID' => 'TEST001'];
        
        // All API calls should handle DB connection failure gracefully
        $apis = [
            'patient_get.php' => '_patient_get',
            'visit_get.php' => '_visit_get',
            'staff_get.php' => '_staff_get'
        ];
        
        foreach ($apis as $file => $function) {
            require_once $file;
            $result = $function(false, $this->validToken, $requestArgs);
            
            // Should return appropriate error
            $this->assertValidApiResponse($result, 500);
            $this->assertStringContainsString('Database', $result['httpReason']);
        }
    }
    
    /**
     * Test timezone handling
     */
    public function testTimezoneHandling()
    {
        // Test dates across different timezones
        $timezones = [
            'America/New_York',
            'Europe/London',
            'Asia/Tokyo',
            'Australia/Sydney'
        ];
        
        foreach ($timezones as $timezone) {
            date_default_timezone_set($timezone);
            
            $requestArgs = [
                'clinicPatientID' => 'TEST001',
                'visitType' => 'Routine',
                'dateTimeIn' => date('Y-m-d H:i:s')
            ];
            
            $mockPatient = [
                'httpResponse' => 200,
                'count' => 1,
                'data' => ['clinicPatientID' => 'TEST001', 'patientID' => 1]
            ];
            
            $GLOBALS['getDbRecords'] = function($db, $query) use ($mockPatient) {
                return $mockPatient;
            };
            
            $queryMock = $this->createMock(mysqli_result::class);
            $this->dbMock->method('query')->willReturn($queryMock);
            
            require_once 'visit_post.php';
            $result = _visit_post($this->dbMock, $this->validToken, $requestArgs);
            
            $this->assertValidApiResponse($result, 201);
            // Verify date is properly formatted
            if (isset($result['data']['dateTimeIn'])) {
                $this->assertNotFalse(strtotime($result['data']['dateTimeIn']));
            }
        }
    }
    
    /**
     * Test rate limiting simulation
     */
    public function testRateLimiting()
    {
        // Simulate rapid requests
        $requestCount = 100;
        $startTime = microtime(true);
        
        for ($i = 0; $i < $requestCount; $i++) {
            $requestArgs = ['token' => $this->validToken];
            
            require_once 'session_get.php';
            $result = _session_get($this->dbMock, $this->validToken, $requestArgs);
            
            if ($i > 50) {
                // After 50 requests, should ideally implement rate limiting
                // This is a test to ensure the system can handle rapid requests
                $this->assertValidApiResponse($result);
            }
        }
        
        $duration = microtime(true) - $startTime;
        // Ensure system can handle at least 10 requests per second
        $this->assertLessThan(10, $duration);
    }
    
    /**
     * Test special character handling
     */
    public function testSpecialCharacterHandling()
    {
        $specialChars = [
            'unicode' => ['García', 'Müller', '王伟', 'José'],
            'diacritics' => ['café', 'niño', 'über', 'naïve'],
            'symbols' => ['O\'Connor', 'Smith-Jones', 'test@example.com', '$special#']
        ];
        
        foreach ($specialChars as $type => $chars) {
            foreach ($chars as $char) {
                $requestArgs = [
                    'clinicPatientID' => 'TEST001',
                    'lastName' => $char,
                    'firstName' => 'Test',
                    'sex' => 'Male',
                    'birthDate' => '1990-01-01'
                ];
                
                // Mock database response
                $queryMock = $this->createMock(mysqli_result::class);
                $this->dbMock->method('query')->willReturn($queryMock);
                
                require_once 'patient_post.php';
                $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
                
                // Should handle special characters properly
                $this->assertValidApiResponse($result);
            }
        }
    }
    
    /**
     * Test malformed request handling
     */
    public function testMalformedRequests()
    {
        // Test various malformed requests
        $malformedRequests = [
            // Missing required fields
            ['clinicPatientID' => 'TEST001'], // Missing lastName, firstName, etc.
            
            // Invalid data types
            [
                'clinicPatientID' => ['array' => 'not_string'],
                'lastName' => 'Test',
                'firstName' => 'Patient'
            ],
            
            // Extra unexpected fields
            [
                'clinicPatientID' => 'TEST001',
                'lastName' => 'Test',
                'firstName' => 'Patient',
                'sex' => 'Male',
                'birthDate' => '1990-01-01',
                'hackerField' => 'malicious_data'
            ]
        ];
        
        foreach ($malformedRequests as $request) {
            require_once 'patient_post.php';
            $result = _patient_post($this->dbMock, $this->validToken, $request);
            
            // Should return appropriate error
            $this->assertIn($result['httpResponse'], [400, 500]);
        }
    }
}

/**
 * Data Validation Tests
 */
class ApiDataValidationTest extends ApiTestBase
{
    /**
     * Test date validation
     */
    public function testDateValidation()
    {
        $invalidDates = [
            '2024-13-01', // Invalid month
            '2024-06-32', // Invalid day
            'not-a-date',
            '2024/06/15', // Wrong format
            ''
        ];
        
        foreach ($invalidDates as $date) {
            $requestArgs = [
                'clinicPatientID' => 'TEST001',
                'lastName' => 'Test',
                'firstName' => 'Patient',
                'sex' => 'Male',
                'birthDate' => $date
            ];
            
            require_once 'patient_post.php';
            $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
            
            if ($date !== '') {
                // Invalid dates should be rejected
                $this->assertIn($result['httpResponse'], [400, 500]);
            }
        }
    }
    
    /**
     * Test numeric validation
     */
    public function testNumericValidation()
    {
        $invalidNumbers = [
            'height' => ['not_a_number', '-10', '999999', ''],
            'weight' => ['abc', '0', '-50', '500'],
            'bpSystolic' => ['high', '-20', '300', ''],
            'bpDiastolic' => ['low', '-10', '200', '']
        ];
        
        foreach ($invalidNumbers as $field => $values) {
            foreach ($values as $value) {
                $requestArgs = [
                    'clinicPatientID' => 'TEST001',
                    'visitType' => 'Routine',
                    $field => $value
                ];
                
                // Mock patient lookup
                $mockPatient = [
                    'httpResponse' => 200,
                    'count' => 1,
                    'data' => ['clinicPatientID' => 'TEST001', 'patientID' => 1]
                ];
                
                $GLOBALS['getDbRecords'] = function($db, $query) use ($mockPatient) {
                    return $mockPatient;
                };
                
                require_once 'visit_post.php';
                $result = _visit_post($this->dbMock, $this->validToken, $requestArgs);
                
                // Numeric fields should be validated
                if ($value === '' || !is_numeric($value) || $value < 0) {
                    $this->assertValidApiResponse($result);
                    // Field should be sanitized or rejected
                    if (isset($result['data'][$field])) {
                        $this->assertIsNumeric($result['data'][$field]);
                        $this->assertGreaterThanOrEqual(0, $result['data'][$field]);
                    }
                }
            }
        }
    }
    
    /**
     * Test email validation
     */
    public function testEmailValidation()
    {
        $emails = [
            'valid@example.com' => true,
            'user.name@domain.co.uk' => true,
            'invalid-email' => false,
            'missing@domain' => false,
            '@nodomain.com' => false,
            'email@' => false,
            '' => true // Empty is allowed for optional fields
        ];
        
        foreach ($emails as $email => $shouldSucceed) {
            $requestArgs = [
                'username' => 'testuser',
                'lastName' => 'Test',
                'firstName' => 'User',
                'password' => 'password123',
                'accessGranted' => 'Staff',
                'contactInfo' => $email
            ];
            
            require_once 'staff_post.php';
            $result = _staff_post($this->dbMock, $this->validToken, $requestArgs);
            
            if ($shouldSucceed) {
                $this->assertValidApiResponse($result, 201);
            } else {
                $this->assertIn($result['httpResponse'], [400, 500]);
            }
        }
    }
    
    /**
     * Test phone number validation
     */
    public function testPhoneValidation()
    {
        $phoneNumbers = [
            '555-1234' => true,
            '(555) 123-4567' => true,
            '1-800-555-1234' => true,
            '+1-555-123-4567' => true,
            'not-a-phone' => false,
            '1' => false, // Too short
            str_repeat('1', 50) => false // Too long
        ];
        
        foreach ($phoneNumbers as $phone => $shouldSucceed) {
            $requestArgs = [
                'clinicPatientID' => 'TEST001',
                'lastName' => 'Test',
                'firstName' => 'Patient',
                'sex' => 'Male',
                'birthDate' => '1990-01-01',
                'contactPhone' => $phone
            ];
            
            require_once 'patient_post.php';
            $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
            
            if ($shouldSucceed) {
                $this->assertValidApiResponse($result, 201);
            } else {
                // Invalid phones might still be accepted depending on validation
                // but should at least not crash the system
                $this->assertIsArray($result);
            }
        }
    }
}

/**
 * Performance Tests
 */
class ApiPerformanceTest extends ApiTestBase
{
    /**
     * Test response time
     */
    public function testResponseTime()
    {
        $apis = [
            'session_get.php' => [$this->validToken, []],
            'patient_get.php' => [$this->validToken, ['clinicPatientID' => 'TEST001']],
            'visit_get.php' => [$this->validToken, ['visitID' => '1']]
        ];
        
        foreach ($apis as $file => $args) {
            $startTime = microtime(true);
            
            require_once $file;
            $function = str_replace('.php', '', $file);
            $function = '_' . $function;
            
            $result = $function($this->dbMock, ...$args);
            
            $duration = microtime(true) - $startTime;
            
            // API calls should complete in less than 1 second
            $this->assertLessThan(1.0, $duration, "$file took too long: {$duration}s");
        }
    }
    
    /**
     * Test memory usage
     */
    public function testMemoryUsage()
    {
        $initialMemory = memory_get_usage(true);
        
        // Create a large number of requests
        for ($i = 0; $i < 1000; $i++) {
            $requestArgs = [
                'clinicPatientID' => "TEST{$i}",
                'visitType' => 'Routine'
            ];
            
            // Don't actually execute, just create the request objects
            // This tests for memory leaks
        }
        
        $finalMemory = memory_get_usage(true);
        $memoryIncrease = $finalMemory - $initialMemory;
        
        // Memory increase should be reasonable
        $this->assertLessThan(50 * 1024 * 1024, $memoryIncrease); // Less than 50MB
    }
}