<!-- vale Readability.FleschKincaid = NO -->
<!-- vale Google.Headings = NO -->
<!-- vale Google.Parens = NO -->
<!-- vale write-good = NO -->
# REST API Unit Tests

This test suite provides comprehensive testing for the REST API endpoints, including unit tests, integration tests, security tests, and edge case validation.

## Overview

The test suite includes:

- Unit tests for all REST endpoints
- Security vulnerability testing (SQL injection, XSS, access control)
- Edge case handling (malformed requests, large inputs, special characters)
- Data validation tests
- Performance benchmarking
- Integration tests for complete workflows

## Test Structure

```text
api/tests/
├── bootstrap.php              # Test environment setup
├── phpunit.xml               # PHPUnit configuration
├── test-runner.php           # Main test runner
├── test-utilities.php        # Mock helpers and utilities
├── security-edge-cases.php   # Security and edge case tests
└── tests/
    ├── SessionApiTest.php    # Session endpoint tests
    ├── PatientApiTest.php    # Patient endpoint tests
    ├── VisitApiTest.php      # Visit endpoint tests
    ├── StaffApiTest.php      # Staff endpoint tests
    ├── IcdApiTest.php        # ICD endpoint tests
    ├── CommentApiTest.php    # Comment endpoint tests
    └── ApiIntegrationTest.php # Integration scenarios
```

## Requirements

- PHP 7.4+ (8.0+ recommended)
- PHPUnit 9+
- Composer for dependency management
- MySQL (for integration tests)

## Installation

1. Install dependencies:

    ```bash
    composer install
    ```

1. Set up test database (for integration tests):

    ```bash
    mysql -u root -p < sql/test_schema.sql
    mysql -u root -p test_database < sql/test_data.sql
    ```

1. Configure test environment:

    ```bash
    cp config/test_config.example.php config/test_config.php
    # Edit config/test_config.php with your test database credentials
    ```

## Running Tests

### Run all tests

```bash
php test-runner.php
```

### Run specific test suite

```bash
vendor/bin/phpunit --testsuite "API Tests"
vendor/bin/phpunit --testsuite "Security Tests"
vendor/bin/phpunit --testsuite "Performance Tests"
```

### Run individual test file

```bash
vendor/bin/phpunit tests/SessionApiTest.php
vendor/bin/phpunit tests/PatientApiTest.php
```

### Generate coverage report

```bash
GENERATE_COVERAGE=true php test-runner.php
```

### Run integration tests

```bash
RUN_INTEGRATION_TESTS=true php test-runner.php
```

## Test Types

### 1. Unit Tests

Test individual functions and methods in isolation:

- Request parameter validation
- Database query building
- Response formatting
- Error handling

Example:

```php
public function testPatientPostSuccess()
{
    $requestArgs = [
        'clinicPatientID' => 'TEST001',
        'lastName' => 'Smith',
        'firstName' => 'John',
        'sex' => 'Male',
        'birthDate' => '1990-01-01'
    ];
    
    $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
    
    $this->assertValidApiResponse($result, 201);
    $this->assertEquals('TEST001', $result['data']['clinicPatientID']);
}
```

### 2. Security Tests

Test for common security vulnerabilities:

- SQL injection protection
- XSS prevention
- Access control enforcement
- Token validation
- File upload restrictions

Example:

```php
public function testSqlInjectionPrevention()
{
    $injectionPayload = "'; DROP TABLE patient; --";
    $requestArgs = ['lastName' => $injectionPayload];
    
    $result = _patient_get($this->dbMock, $this->validToken, $requestArgs);
    
    // Should handle injection attempt safely
    $this->assertValidApiResponse($result);
    // No database tables should be dropped
}
```

### 3. Edge Case Tests

Test unusual or extreme scenarios:

- Very large input data
- Malformed requests
- Special characters in data
- Concurrent request handling
- Database connection failures

Example:

```php
public function testLargeInputHandling()
{
    $longString = str_repeat('a', 1000);
    $requestArgs = [
        'clinicPatientID' => 'TEST001',
        'lastName' => $longString,
        // ... other fields
    ];
    
    $result = _patient_post($this->dbMock, $this->validToken, $requestArgs);
    
    // Should handle large inputs without error
    $this->assertValidApiResponse($result);
}
```

### 4. Integration Tests

Test complete workflows across multiple endpoints:

- Create patient → Create visit → Update visit
- User registration → Login → Access protected resources
- Complete clinical encounter workflow

Example:

```php
public function testPatientVisitWorkflow()
{
    // 1. Create patient
    $patientResult = _patient_post($this->dbMock, $this->validToken, $patientData);
    $this->assertValidApiResponse($patientResult, 201);
    
    // 2. Create visit
    $visitResult = _visit_post($this->dbMock, $this->validToken, $visitData);
    $this->assertValidApiResponse($visitResult, 201);
    
    // 3. Update visit
    $updateResult = _visit_patch($this->dbMock, $this->validToken, $updateData);
    $this->assertValidApiResponse($updateResult);
}
```

## Test Utilities

The test suite includes several utility classes:

### MockDatabase

Simulates database operations with predictable responses:

```php
$mockDb = new MockDatabase();
$mockDb->addQueryResponse('SELECT * FROM patient', $expectedResponse);
```

### MockSecurityContext

Handles authentication and authorization testing:

```php
$mockSecurity = new MockSecurityContext();
$mockSecurity->addValidToken('test_token', 'testuser', 'Staff');
```

### TestDataFactory

Generates realistic test data:

```php
$patient = TestDataFactory::generatePatient();
$visit = TestDataFactory::generateVisit($patient['clinicPatientID']);
```

### ApiTestHelper

Provides common validation and setup functions:

```php
ApiTestHelper::validateApiResponse($test, $response, 200);
ApiTestHelper::createRequest($data, 'POST');
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Comprehensive**: Test both success and failure scenarios
3. **Realistic**: Use meaningful test data that resembles production data
4. **Performance**: Keep individual tests fast (< 1 second)
5. **Coverage**: Aim for >80% code coverage
6. **Documentation**: Document complex test scenarios

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Verify database credentials in test configuration
   - Ensure test database exists and is accessible

2. **Mock function conflicts**:
   - Clear global functions between tests
   - Use proper test isolation

3. **Timeout issues**:
   - Check query performance
   - Verify database indexes exist

### Debug Mode

Run tests with debugging enabled:

```bash
API_DEBUG_MODE=true php test-runner.php
```

This setting provide detailed information about:

- SQL queries executed
- API responses and errors
- Test execution flow

## Contributing

To add new tests:

1. Create test file in appropriate directory
2. Extend from `ApiTestBase` class
3. Use naming convention: `test[Functionality][Scenario]()`
4. Include `docblock` with test description
5. Follow existing patterns for consistency

Example:

```php
class NewEndpointTest extends ApiTestBase
{
    /**
     * Test successful POST to new endpoint
     */
    public function testNewEndpointPostSuccess()
    {
        // Test implementation
    }
}
```

## Performance Benchmarks

The test suite includes performance benchmarks:

### Response Time Requirements

- Session operations: < 500&nbsp;ms
- Patient lookups: < 1&nbsp;s
- Visit creation: < 2&nbsp;s
- Bulk operations: < 5&nbsp;s

### Memory Usage

- Individual tests: < 10&nbsp;MB
- Full test suite: < 100&nbsp;MB

## Continuous Integration

For CI/CD integration, use:

```bash
# Run all tests and generate reports
php test-runner.php

# Check exit code for CI status
echo $?
```

Test reports generated appear in:

- `test-report.html` - Human-readable report
- `test-report.json` - Machine-readable format
- `coverage-html/` - Code coverage report (if enabled)

## Maintenance

Regular maintenance tasks:

1. Update test data as schema changes
2. Add tests for new API endpoints
3. Review and update security tests
4. Monitor performance benchmarks
5. Keep dependencies updated

For questions or issues, contact the API team or create an issue in the repository.
