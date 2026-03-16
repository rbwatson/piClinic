# piClinc Comprehensive Testing Strategy

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Frontend Testing](#frontend-testing)
4. [Backend Testing (PHP)](#backend-testing-php)
5. [Backend Testing (Node.js - if chosen)](#backend-testing-nodejs)
6. [Integration Testing](#integration-testing)
7. [E2E Testing](#e2e-testing)
8. [Test Data Management](#test-data-management)
9. [Coverage Requirements](#coverage-requirements)
10. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should survive refactoring

2. **Fast Feedback Loop**
   - Unit tests run in < 5 seconds
   - Integration tests run in < 30 seconds
   - E2E tests run in < 5 minutes

3. **Test at the Right Level**
   - Unit tests: 70% of tests
   - Integration tests: 20% of tests
   - E2E tests: 10% of tests

4. **Maintainable Tests**
   - DRY (Don't Repeat Yourself) in test setup
   - Clear test names that describe behavior
   - One assertion per test (when possible)

5. **Isolated Tests**
   - Each test runs independently
   - No shared state between tests
   - Deterministic results

---

## Testing Pyramid

```
        /\
       /  \  E2E Tests (10%)
      /----\  - Critical user flows
     /      \ - Login → Dashboard → Patient → Visit
    /--------\ Integration Tests (20%)
   /          \ - API endpoint tests
  /            \ - Database integration
 /--------------\ Unit Tests (70%)
/                \ - Components, Services, Utils
```

**Target Test Counts (estimated):**
- ~200 unit tests
- ~50 integration tests
- ~15 E2E test scenarios

---

## Frontend Testing

### Testing Stack

```json
{
  "devDependencies": {
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "msw": "^2.0.11",
    "happy-dom": "^12.10.3"
  }
}
```

**Tools:**
- **Vitest** - Fast unit test runner (Vite-native)
- **React Testing Library** - Component testing (user-centric)
- **MSW (Mock Service Worker)** - API mocking
- **Happy DOM** - Lightweight DOM implementation

### Frontend Test Organization

```
frontend/src/
├── __tests__/                    # Global test utilities
│   ├── setup.ts                  # Test setup and config
│   ├── test-utils.tsx            # Custom render functions
│   └── mocks/
│       ├── handlers.ts           # MSW API handlers
│       └── server.ts             # MSW server setup
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx   # Component tests
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   └── Input.test.tsx
│   │   └── Table/
│   │       ├── Table.tsx
│   │       └── Table.test.tsx
│   └── patients/
│       ├── PatientForm/
│       │   ├── PatientForm.tsx
│       │   └── PatientForm.test.tsx
│       └── PatientCard/
│           ├── PatientCard.tsx
│           └── PatientCard.test.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts           # Hook tests
│   ├── usePatients.ts
│   └── usePatients.test.ts
├── utils/
│   ├── validation.ts
│   ├── validation.test.ts        # Utility tests
│   ├── formatting.ts
│   └── formatting.test.ts
└── pages/
    └── Dashboard/
        ├── Dashboard.tsx
        └── Dashboard.test.tsx    # Page tests
```

### 1. Component Testing

#### Pattern: Basic Component Test

```typescript
// src/components/common/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

#### Pattern: Form Component Test

```typescript
// src/components/patients/PatientForm/PatientForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientForm } from './PatientForm';

describe('PatientForm Component', () => {
  const mockOnSubmit = vi.fn();

  it('renders all required fields', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/patient id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sex/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    // Try to submit without filling fields
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/patient id is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    // Fill in the form
    await user.type(screen.getByLabelText(/patient id/i), 'P001');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.selectOptions(screen.getByLabelText(/sex/i), 'M');

    // Submit
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        clinicPatientID: 'P001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'M',
      });
    });
  });

  it('populates form with initial data in edit mode', () => {
    const initialData = {
      clinicPatientID: 'P001',
      firstName: 'John',
      lastName: 'Doe',
      sex: 'M',
    };

    render(<PatientForm onSubmit={mockOnSubmit} initialData={initialData} />);

    expect(screen.getByLabelText(/patient id/i)).toHaveValue('P001');
    expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
  });
});
```

#### Pattern: Component with Context

```typescript
// src/components/Header/Header.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from './Header';

// Custom render with providers
const renderWithAuth = (ui: React.ReactElement, { user = null } = {}) => {
  return render(
    <AuthProvider value={{ user, logout: vi.fn() }}>
      {ui}
    </AuthProvider>
  );
};

describe('Header Component', () => {
  it('shows login button when not authenticated', () => {
    renderWithAuth(<Header />, { user: null });
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows user name when authenticated', () => {
    const user = { username: 'jdoe', firstName: 'John', lastName: 'Doe' };
    renderWithAuth(<Header />, { user });

    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
```

### 2. Custom Hook Testing

```typescript
// src/hooks/usePatients.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { usePatients } from './usePatients';

// MSW server for API mocking
const server = setupServer();

beforeEach(() => server.listen());
afterEach(() => server.resetHandlers());
afterEach(() => server.close());

// Wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePatients hook', () => {
  it('fetches patient by ID', async () => {
    const mockPatient = {
      clinicPatientID: 'P001',
      firstName: 'John',
      lastName: 'Doe',
    };

    server.use(
      rest.get('/api/v2/patients/P001', (req, res, ctx) => {
        return res(ctx.json({ data: mockPatient }));
      })
    );

    const { result } = renderHook(
      () => usePatients().usePatient('P001'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPatient);
  });

  it('handles error when patient not found', async () => {
    server.use(
      rest.get('/api/v2/patients/INVALID', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ error: 'Not found' }));
      })
    );

    const { result } = renderHook(
      () => usePatients().usePatient('INVALID'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('creates new patient', async () => {
    const newPatient = {
      clinicPatientID: 'P002',
      firstName: 'Jane',
      lastName: 'Smith',
      sex: 'F',
    };

    server.use(
      rest.post('/api/v2/patients', async (req, res, ctx) => {
        const body = await req.json();
        return res(ctx.json({ data: { ...body, id: 'P002' } }));
      })
    );

    const { result } = renderHook(
      () => usePatients().useCreatePatient(),
      { wrapper: createWrapper() }
    );

    result.current.mutate(newPatient);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveProperty('id', 'P002');
  });
});
```

### 3. Utility Function Testing

```typescript
// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validatePatientID, validateBirthDate, formatPatientName } from './validation';

describe('validation utilities', () => {
  describe('validatePatientID', () => {
    it('accepts valid patient ID', () => {
      expect(validatePatientID('P001')).toBe(true);
      expect(validatePatientID('ABC123')).toBe(true);
    });

    it('rejects empty patient ID', () => {
      expect(validatePatientID('')).toBe(false);
      expect(validatePatientID('   ')).toBe(false);
    });

    it('rejects patient ID exceeding max length', () => {
      const longID = 'A'.repeat(51);
      expect(validatePatientID(longID)).toBe(false);
    });

    it('rejects patient ID with special characters', () => {
      expect(validatePatientID('P001!')).toBe(false);
      expect(validatePatientID('P@001')).toBe(false);
    });
  });

  describe('validateBirthDate', () => {
    it('accepts valid date', () => {
      expect(validateBirthDate('2000-01-15')).toBe(true);
    });

    it('rejects future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      expect(validateBirthDate(futureDate)).toBe(false);
    });

    it('rejects invalid date format', () => {
      expect(validateBirthDate('01/15/2000')).toBe(false);
      expect(validateBirthDate('invalid')).toBe(false);
    });

    it('rejects unrealistic old dates', () => {
      expect(validateBirthDate('1850-01-01')).toBe(false);
    });
  });

  describe('formatPatientName', () => {
    it('formats name correctly', () => {
      expect(formatPatientName('Doe', 'John', 'M')).toBe('Doe, John (M)');
      expect(formatPatientName('Smith', 'Jane', 'F')).toBe('Smith, Jane (F)');
    });

    it('handles missing middle initial', () => {
      expect(formatPatientName('Doe', 'John')).toBe('Doe, John');
    });

    it('trims whitespace', () => {
      expect(formatPatientName('  Doe  ', '  John  ', 'M')).toBe('Doe, John (M)');
    });
  });
});
```

### 4. Page/Integration Testing

```typescript
// src/pages/Dashboard/Dashboard.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Dashboard } from './Dashboard';
import { AppProviders } from '@/test-utils';

const server = setupServer();

beforeEach(() => server.listen());
afterEach(() => server.resetHandlers());
afterEach(() => server.close());

describe('Dashboard Page', () => {
  it('displays open visits on load', async () => {
    const mockVisits = [
      {
        patientVisitID: 'V001',
        patientFirstName: 'John',
        patientLastName: 'Doe',
        dateTimeIn: '2026-03-15T08:30:00',
        visitStatus: 'Open',
      },
      {
        patientVisitID: 'V002',
        patientFirstName: 'Jane',
        patientLastName: 'Smith',
        dateTimeIn: '2026-03-15T09:00:00',
        visitStatus: 'Open',
      },
    ];

    server.use(
      rest.get('/api/v2/visits', (req, res, ctx) => {
        const status = req.url.searchParams.get('visitStatus');
        if (status === 'Open') {
          return res(ctx.json({ data: mockVisits, count: 2 }));
        }
        return res(ctx.json({ data: [], count: 0 }));
      })
    );

    render(<Dashboard />, { wrapper: AppProviders });

    await waitFor(() => {
      expect(screen.getByText(/doe, john/i)).toBeInTheDocument();
      expect(screen.getByText(/smith, jane/i)).toBeInTheDocument();
    });
  });

  it('shows message when no open visits', async () => {
    server.use(
      rest.get('/api/v2/visits', (req, res, ctx) => {
        return res(ctx.json({ data: [], count: 0 }));
      })
    );

    render(<Dashboard />, { wrapper: AppProviders });

    await waitFor(() => {
      expect(screen.getByText(/no patients currently admitted/i)).toBeInTheDocument();
    });
  });

  it('allows searching for patients', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('/api/v2/patients', (req, res, ctx) => {
        const query = req.url.searchParams.get('q');
        if (query === 'Doe') {
          return res(ctx.json({
            data: [{ clinicPatientID: 'P001', lastName: 'Doe', firstName: 'John' }],
            count: 1
          }));
        }
        return res(ctx.json({ data: [], count: 0 }));
      })
    );

    render(<Dashboard />, { wrapper: AppProviders });

    const searchInput = screen.getByPlaceholderText(/search patient/i);
    await user.type(searchInput, 'Doe');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/doe, john/i)).toBeInTheDocument();
    });
  });

  it('allows sorting visits by different fields', async () => {
    const user = userEvent.setup();
    const mockVisits = [
      { patientVisitID: 'V001', patientLastName: 'Doe', dateTimeIn: '2026-03-15T08:30:00' },
      { patientVisitID: 'V002', patientLastName: 'Adams', dateTimeIn: '2026-03-15T09:00:00' },
    ];

    server.use(
      rest.get('/api/v2/visits', (req, res, ctx) => {
        const sortField = req.url.searchParams.get('sortfield');
        const sorted = sortField === 'patientLastName'
          ? [...mockVisits].sort((a, b) => a.patientLastName.localeCompare(b.patientLastName))
          : mockVisits;
        return res(ctx.json({ data: sorted, count: sorted.length }));
      })
    );

    render(<Dashboard />, { wrapper: AppProviders });

    // Click on name column header to sort
    await user.click(screen.getByRole('button', { name: /sort by name/i }));

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent(/adams/i);
      expect(rows[2]).toHaveTextContent(/doe/i);
    });
  });
});
```

### 5. Test Utilities Setup

```typescript
// src/__tests__/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n-test';

// Create a new QueryClient for each test to avoid cache pollution
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

interface AllProvidersProps {
  children: React.ReactNode;
  user?: any;
}

export const AllProviders = ({ children, user = null }: AllProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <AuthProvider value={{ user, logout: vi.fn() }}>
            {children}
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: any;
}

export const customRender = (
  ui: ReactElement,
  { user, ...options }: CustomRenderOptions = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => <AllProviders user={user}>{children}</AllProviders>,
    ...options,
  });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };
```

```typescript
// src/__tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/v2/auth/login', async (req, res, ctx) => {
    const { username, password } = await req.json();

    if (username === 'testuser' && password === 'testpass') {
      return res(
        ctx.json({
          token: 'mock-jwt-token',
          user: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            accessLevel: 'ClinicStaff',
          },
        })
      );
    }

    return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
  }),

  // Patient endpoints
  rest.get('/api/v2/patients/:id', (req, res, ctx) => {
    const { id } = req.params;

    return res(
      ctx.json({
        data: {
          clinicPatientID: id,
          firstName: 'John',
          lastName: 'Doe',
          sex: 'M',
        },
      })
    );
  }),

  rest.get('/api/v2/patients', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');

    return res(
      ctx.json({
        data: [
          {
            clinicPatientID: 'P001',
            firstName: 'John',
            lastName: 'Doe',
          },
        ],
        count: 1,
      })
    );
  }),

  // Visit endpoints
  rest.get('/api/v2/visits', (req, res, ctx) => {
    const status = req.url.searchParams.get('visitStatus');

    if (status === 'Open') {
      return res(
        ctx.json({
          data: [
            {
              patientVisitID: 'V001',
              clinicPatientID: 'P001',
              patientFirstName: 'John',
              patientLastName: 'Doe',
              visitStatus: 'Open',
              dateTimeIn: '2026-03-15T08:30:00',
            },
          ],
          count: 1,
        })
      );
    }

    return res(ctx.json({ data: [], count: 0 }));
  }),
];
```

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## Backend Testing (PHP)

### Testing Stack

```json
{
  "require-dev": {
    "phpunit/phpunit": "^10.0",
    "phpstan/phpstan": "^1.10",
    "mockery/mockery": "^1.6",
    "fakerphp/faker": "^1.23"
  }
}
```

**Tools:**
- **PHPUnit** - Unit testing framework
- **PHPStan** - Static analysis (type checking)
- **Mockery** - Mocking framework
- **Faker** - Test data generation

### Backend Test Organization

```
www/html/api/
├── tests/
│   ├── Unit/
│   │   ├── Services/
│   │   │   ├── PatientServiceTest.php
│   │   │   ├── VisitServiceTest.php
│   │   │   └── AuthServiceTest.php
│   │   ├── Validators/
│   │   │   ├── PatientValidatorTest.php
│   │   │   └── VisitValidatorTest.php
│   │   └── Utils/
│   │       └── ValidationUtilsTest.php
│   ├── Integration/
│   │   ├── Api/
│   │   │   ├── PatientApiTest.php
│   │   │   ├── VisitApiTest.php
│   │   │   └── AuthApiTest.php
│   │   └── Database/
│   │       ├── PatientRepositoryTest.php
│   │       └── VisitRepositoryTest.php
│   ├── Fixtures/
│   │   ├── PatientFixtures.php
│   │   └── VisitFixtures.php
│   └── bootstrap.php
├── phpunit.xml
└── phpstan.neon
```

### 1. Service Layer Testing

```php
<?php
// tests/Unit/Services/PatientServiceTest.php

use PHPUnit\Framework\TestCase;
use Mockery;
use App\Services\PatientService;
use App\Repositories\PatientRepository;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

class PatientServiceTest extends TestCase
{
    private PatientRepository $repository;
    private PatientService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Create mock repository
        $this->repository = Mockery::mock(PatientRepository::class);

        // Inject into service
        $this->service = new PatientService($this->repository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function testGetPatientById_WhenExists_ReturnsPatient(): void
    {
        // Arrange
        $patientId = 'P001';
        $expectedPatient = [
            'clinicPatientID' => 'P001',
            'firstName' => 'John',
            'lastName' => 'Doe',
        ];

        $this->repository
            ->shouldReceive('findById')
            ->once()
            ->with($patientId)
            ->andReturn($expectedPatient);

        // Act
        $result = $this->service->getById($patientId);

        // Assert
        $this->assertEquals($expectedPatient, $result);
    }

    public function testGetPatientById_WhenNotExists_ThrowsNotFoundException(): void
    {
        // Arrange
        $this->repository
            ->shouldReceive('findById')
            ->once()
            ->with('INVALID')
            ->andReturn(null);

        // Assert
        $this->expectException(NotFoundException::class);
        $this->expectExceptionMessage('Patient not found');

        // Act
        $this->service->getById('INVALID');
    }

    public function testCreatePatient_WithValidData_CreatesPatient(): void
    {
        // Arrange
        $patientData = [
            'clinicPatientID' => 'P001',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'sex' => 'M',
        ];

        // Check ID doesn't exist
        $this->repository
            ->shouldReceive('findById')
            ->once()
            ->with('P001')
            ->andReturn(null);

        // Create patient
        $this->repository
            ->shouldReceive('create')
            ->once()
            ->with($patientData)
            ->andReturn(array_merge($patientData, ['createdDate' => '2026-03-15']));

        // Act
        $result = $this->service->create($patientData);

        // Assert
        $this->assertEquals('P001', $result['clinicPatientID']);
        $this->assertArrayHasKey('createdDate', $result);
    }

    public function testCreatePatient_WithDuplicateId_ThrowsValidationException(): void
    {
        // Arrange
        $patientData = [
            'clinicPatientID' => 'P001',
            'firstName' => 'John',
            'lastName' => 'Doe',
        ];

        $this->repository
            ->shouldReceive('findById')
            ->once()
            ->with('P001')
            ->andReturn(['clinicPatientID' => 'P001']); // Already exists

        // Assert
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Patient ID already exists');

        // Act
        $this->service->create($patientData);
    }

    public function testSearchPatients_WithQuery_ReturnsMatches(): void
    {
        // Arrange
        $query = 'Doe';
        $expected = [
            ['clinicPatientID' => 'P001', 'lastName' => 'Doe', 'firstName' => 'John'],
            ['clinicPatientID' => 'P002', 'lastName' => 'Doe', 'firstName' => 'Jane'],
        ];

        $this->repository
            ->shouldReceive('searchByQuery')
            ->once()
            ->with($query)
            ->andReturn($expected);

        // Act
        $result = $this->service->search(['query' => $query]);

        // Assert
        $this->assertCount(2, $result);
        $this->assertEquals('Doe', $result[0]['lastName']);
    }
}
```

### 2. Repository Layer Testing (with Database)

```php
<?php
// tests/Integration/Database/PatientRepositoryTest.php

use PHPUnit\Framework\TestCase;
use App\Repositories\PatientRepository;
use Tests\DatabaseTestCase;

class PatientRepositoryTest extends DatabaseTestCase
{
    private PatientRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new PatientRepository($this->dbConnection);
        $this->seedDatabase();
    }

    private function seedDatabase(): void
    {
        // Insert test data
        $this->db->insert('patient', [
            'clinicPatientID' => 'TEST001',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'sex' => 'M',
            'birthDate' => '1990-01-15',
        ]);
    }

    public function testFindById_WhenExists_ReturnsPatient(): void
    {
        // Act
        $patient = $this->repository->findById('TEST001');

        // Assert
        $this->assertNotNull($patient);
        $this->assertEquals('John', $patient['firstName']);
        $this->assertEquals('Doe', $patient['lastName']);
    }

    public function testFindById_WhenNotExists_ReturnsNull(): void
    {
        // Act
        $patient = $this->repository->findById('NONEXISTENT');

        // Assert
        $this->assertNull($patient);
    }

    public function testCreate_InsertsPatientIntoDatabase(): void
    {
        // Arrange
        $newPatient = [
            'clinicPatientID' => 'TEST002',
            'firstName' => 'Jane',
            'lastName' => 'Smith',
            'sex' => 'F',
            'birthDate' => '1985-05-20',
        ];

        // Act
        $result = $this->repository->create($newPatient);

        // Assert
        $this->assertEquals('TEST002', $result['clinicPatientID']);

        // Verify in database
        $fromDb = $this->repository->findById('TEST002');
        $this->assertNotNull($fromDb);
        $this->assertEquals('Jane', $fromDb['firstName']);
    }

    public function testUpdate_UpdatesPatientInDatabase(): void
    {
        // Arrange
        $updates = [
            'firstName' => 'Jonathan',
            'homeCity' => 'Springfield',
        ];

        // Act
        $result = $this->repository->update('TEST001', $updates);

        // Assert
        $this->assertEquals('Jonathan', $result['firstName']);
        $this->assertEquals('Springfield', $result['homeCity']);

        // Verify in database
        $fromDb = $this->repository->findById('TEST001');
        $this->assertEquals('Jonathan', $fromDb['firstName']);
    }

    public function testSearchByQuery_FindsExactMatch(): void
    {
        // Act
        $results = $this->repository->searchByQuery('TEST001');

        // Assert
        $this->assertCount(1, $results);
        $this->assertEquals('TEST001', $results[0]['clinicPatientID']);
    }

    public function testSearchByQuery_FindsPartialMatch(): void
    {
        // Seed additional patient
        $this->db->insert('patient', [
            'clinicPatientID' => 'TEST003',
            'firstName' => 'Johnny',
            'lastName' => 'Doe',
            'sex' => 'M',
        ]);

        // Act - search by last name
        $results = $this->repository->searchByQuery('Doe');

        // Assert
        $this->assertGreaterThanOrEqual(2, count($results));
    }
}
```

### 3. API Endpoint Testing

```php
<?php
// tests/Integration/Api/PatientApiTest.php

use Tests\ApiTestCase;

class PatientApiTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsStaff(); // Helper to get auth token
    }

    public function testGetPatient_WithValidId_Returns200(): void
    {
        // Arrange
        $this->seedPatient('TEST001', 'John', 'Doe');

        // Act
        $response = $this->get('/api/v2/patients/TEST001');

        // Assert
        $this->assertResponseOk();
        $this->assertResponseJson();
        $this->assertEquals('TEST001', $response['data']['clinicPatientID']);
        $this->assertEquals('John', $response['data']['firstName']);
    }

    public function testGetPatient_WithInvalidId_Returns404(): void
    {
        // Act
        $response = $this->get('/api/v2/patients/INVALID');

        // Assert
        $this->assertResponseStatus(404);
        $this->assertResponseJson();
        $this->assertArrayHasKey('error', $response);
    }

    public function testCreatePatient_WithValidData_Returns201(): void
    {
        // Arrange
        $newPatient = [
            'clinicPatientID' => 'NEW001',
            'firstName' => 'Jane',
            'lastName' => 'Smith',
            'sex' => 'F',
            'birthDate' => '1990-05-15',
        ];

        // Act
        $response = $this->post('/api/v2/patients', $newPatient);

        // Assert
        $this->assertResponseStatus(201);
        $this->assertResponseJson();
        $this->assertEquals('NEW001', $response['data']['clinicPatientID']);

        // Verify in database
        $this->assertDatabaseHas('patient', [
            'clinicPatientID' => 'NEW001',
            'firstName' => 'Jane',
        ]);
    }

    public function testCreatePatient_WithMissingRequiredFields_Returns400(): void
    {
        // Arrange - missing firstName
        $invalidPatient = [
            'clinicPatientID' => 'NEW002',
            'lastName' => 'Smith',
        ];

        // Act
        $response = $this->post('/api/v2/patients', $invalidPatient);

        // Assert
        $this->assertResponseStatus(400);
        $this->assertResponseJson();
        $this->assertStringContainsString('firstName', $response['error']);
    }

    public function testCreatePatient_WithoutAuth_Returns401(): void
    {
        // Arrange
        $this->clearAuthentication();

        $newPatient = [
            'clinicPatientID' => 'NEW003',
            'firstName' => 'Test',
            'lastName' => 'User',
        ];

        // Act
        $response = $this->post('/api/v2/patients', $newPatient);

        // Assert
        $this->assertResponseStatus(401);
    }

    public function testSearchPatients_WithQuery_ReturnsMatches(): void
    {
        // Arrange
        $this->seedPatient('TEST001', 'John', 'Doe');
        $this->seedPatient('TEST002', 'Jane', 'Doe');
        $this->seedPatient('TEST003', 'Bob', 'Smith');

        // Act
        $response = $this->get('/api/v2/patients?q=Doe');

        // Assert
        $this->assertResponseOk();
        $this->assertGreaterThanOrEqual(2, $response['count']);
        $this->assertEquals('Doe', $response['data'][0]['lastName']);
    }

    public function testUpdatePatient_WithValidData_Returns200(): void
    {
        // Arrange
        $this->seedPatient('TEST001', 'John', 'Doe');

        $updates = [
            'homeCity' => 'Springfield',
            'contactPhone' => '555-1234',
        ];

        // Act
        $response = $this->patch('/api/v2/patients/TEST001', $updates);

        // Assert
        $this->assertResponseOk();
        $this->assertEquals('Springfield', $response['data']['homeCity']);
        $this->assertEquals('555-1234', $response['data']['contactPhone']);

        // Verify in database
        $this->assertDatabaseHas('patient', [
            'clinicPatientID' => 'TEST001',
            'homeCity' => 'Springfield',
        ]);
    }

    public function testDeletePatient_WithValidId_Returns204(): void
    {
        // Arrange
        $this->seedPatient('TEST001', 'John', 'Doe');

        // Act
        $response = $this->delete('/api/v2/patients/TEST001');

        // Assert
        $this->assertResponseStatus(204);

        // Verify removed from database
        $this->assertDatabaseMissing('patient', [
            'clinicPatientID' => 'TEST001',
        ]);
    }
}
```

### 4. Test Base Classes

```php
<?php
// tests/DatabaseTestCase.php

use PHPUnit\Framework\TestCase;

abstract class DatabaseTestCase extends TestCase
{
    protected mysqli $dbConnection;
    protected Database $db;

    protected function setUp(): void
    {
        parent::setUp();

        // Connect to test database
        $this->dbConnection = new mysqli(
            $_ENV['DB_HOST'] ?? 'localhost',
            $_ENV['DB_USER'] ?? 'test_user',
            $_ENV['DB_PASS'] ?? 'test_pass',
            $_ENV['DB_NAME'] ?? 'piclinic_test'
        );

        $this->db = new Database($this->dbConnection);

        // Start transaction
        $this->dbConnection->begin_transaction();
    }

    protected function tearDown(): void
    {
        // Rollback transaction (clean up test data)
        $this->dbConnection->rollback();
        $this->dbConnection->close();

        parent::tearDown();
    }

    protected function assertDatabaseHas(string $table, array $data): void
    {
        $where = [];
        $params = [];
        foreach ($data as $key => $value) {
            $where[] = "$key = ?";
            $params[] = $value;
        }

        $query = "SELECT COUNT(*) as count FROM $table WHERE " . implode(' AND ', $where);
        $stmt = $this->dbConnection->prepare($query);
        $stmt->bind_param(str_repeat('s', count($params)), ...$params);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $this->assertGreaterThan(0, $result['count'], "Failed asserting that $table contains matching record");
    }

    protected function assertDatabaseMissing(string $table, array $data): void
    {
        $where = [];
        $params = [];
        foreach ($data as $key => $value) {
            $where[] = "$key = ?";
            $params[] = $value;
        }

        $query = "SELECT COUNT(*) as count FROM $table WHERE " . implode(' AND ', $where);
        $stmt = $this->dbConnection->prepare($query);
        $stmt->bind_param(str_repeat('s', count($params)), ...$params);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $this->assertEquals(0, $result['count'], "Failed asserting that $table does not contain matching record");
    }
}
```

```php
<?php
// tests/ApiTestCase.php

use Tests\DatabaseTestCase;

abstract class ApiTestCase extends DatabaseTestCase
{
    protected ?string $authToken = null;
    protected array $lastResponse;
    protected int $lastResponseCode;

    protected function authenticateAsStaff(string $username = 'testuser'): void
    {
        // Create test user if doesn't exist
        $this->db->insertOrUpdate('staff', [
            'username' => $username,
            'password' => password_hash('testpass', PASSWORD_DEFAULT),
            'accessGranted' => 'ClinicStaff',
            'active' => true,
            'firstName' => 'Test',
            'lastName' => 'User',
        ]);

        // Get auth token
        $response = $this->post('/api/v2/auth/login', [
            'username' => $username,
            'password' => 'testpass',
        ]);

        $this->authToken = $response['token'];
    }

    protected function clearAuthentication(): void
    {
        $this->authToken = null;
    }

    protected function get(string $path, array $query = []): array
    {
        return $this->request('GET', $path, null, $query);
    }

    protected function post(string $path, array $data): array
    {
        return $this->request('POST', $path, $data);
    }

    protected function patch(string $path, array $data): array
    {
        return $this->request('PATCH', $path, $data);
    }

    protected function delete(string $path): array
    {
        return $this->request('DELETE', $path);
    }

    private function request(string $method, string $path, ?array $data = null, array $query = []): array
    {
        // Build URL with query params
        $url = $path;
        if (!empty($query)) {
            $url .= '?' . http_build_query($query);
        }

        // Setup request
        $context = [
            'http' => [
                'method' => $method,
                'header' => [
                    'Content-Type: application/json',
                ],
            ],
        ];

        if ($this->authToken) {
            $context['http']['header'][] = "Authorization: Bearer {$this->authToken}";
        }

        if ($data) {
            $context['http']['content'] = json_encode($data);
        }

        // Make request
        $response = @file_get_contents(
            'http://localhost:8080' . $url,
            false,
            stream_context_create($context)
        );

        // Parse response
        $this->lastResponseCode = $this->parseResponseCode($http_response_header);
        $this->lastResponse = $response ? json_decode($response, true) : [];

        return $this->lastResponse;
    }

    protected function assertResponseOk(): void
    {
        $this->assertEquals(200, $this->lastResponseCode);
    }

    protected function assertResponseStatus(int $expectedCode): void
    {
        $this->assertEquals($expectedCode, $this->lastResponseCode);
    }

    protected function assertResponseJson(): void
    {
        $this->assertNotNull($this->lastResponse);
    }

    protected function seedPatient(string $id, string $firstName, string $lastName): void
    {
        $this->db->insert('patient', [
            'clinicPatientID' => $id,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'sex' => 'M',
        ]);
    }

    private function parseResponseCode(array $headers): int
    {
        foreach ($headers as $header) {
            if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
                return (int)$matches[1];
            }
        }
        return 0;
    }
}
```

### 5. PHPUnit Configuration

```xml
<!-- phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="tests/bootstrap.php"
         colors="true"
         stopOnFailure="false">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
    </testsuites>

    <coverage>
        <include>
            <directory suffix=".php">www/html/api/v2</directory>
        </include>
        <exclude>
            <directory>www/html/api/v2/vendor</directory>
            <directory>tests</directory>
        </exclude>
        <report>
            <html outputDirectory="coverage/html"/>
            <text outputFile="php://stdout" showUncoveredFiles="true"/>
        </report>
    </coverage>

    <php>
        <env name="DB_HOST" value="localhost"/>
        <env name="DB_USER" value="test_user"/>
        <env name="DB_PASS" value="test_pass"/>
        <env name="DB_NAME" value="piclinic_test"/>
        <env name="APP_ENV" value="testing"/>
    </php>
</phpunit>
```

### 6. PHPStan Configuration

```neon
# phpstan.neon
parameters:
    level: 8
    paths:
        - www/html/api/v2
    excludePaths:
        - www/html/api/v2/vendor
    checkMissingIterableValueType: false
```

---

## Test Data Management

### Fixtures and Factories

```php
<?php
// tests/Fixtures/PatientFixtures.php

use Faker\Factory;

class PatientFixtures
{
    private static $faker;

    public static function create(array $overrides = []): array
    {
        if (!self::$faker) {
            self::$faker = Factory::create();
        }

        $defaults = [
            'clinicPatientID' => 'P' . str_pad(self::$faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'firstName' => self::$faker->firstName(),
            'lastName' => self::$faker->lastName(),
            'sex' => self::$faker->randomElement(['M', 'F']),
            'birthDate' => self::$faker->date('Y-m-d', '-18 years'),
            'homeAddress' => self::$faker->streetAddress(),
            'homeCity' => self::$faker->city(),
            'contactPhone' => self::$faker->phoneNumber(),
        ];

        return array_merge($defaults, $overrides);
    }

    public static function createMany(int $count, array $overrides = []): array
    {
        $patients = [];
        for ($i = 0; $i < $count; $i++) {
            $patients[] = self::create($overrides);
        }
        return $patients;
    }
}
```

```typescript
// frontend/src/__tests__/fixtures/patient.ts

import { faker } from '@faker-js/faker';
import { Patient } from '@/types/patient';

export const createPatient = (overrides: Partial<Patient> = {}): Patient => {
  return {
    clinicPatientID: `P${faker.string.numeric(4)}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    sex: faker.helpers.arrayElement(['M', 'F', 'X'] as const),
    birthDate: faker.date.past({ years: 50 }).toISOString().split('T')[0],
    homeAddress: faker.location.streetAddress(),
    homeCity: faker.location.city(),
    contactPhone: faker.phone.number(),
    ...overrides,
  };
};

export const createPatients = (count: number, overrides: Partial<Patient> = {}): Patient[] => {
  return Array.from({ length: count }, () => createPatient(overrides));
};
```

---

## Coverage Requirements

### Minimum Coverage Targets

| Layer | Target | Critical Target |
|-------|--------|-----------------|
| **Frontend Components** | 80% | 90% for forms, critical UI |
| **Frontend Hooks** | 90% | 95% for data hooks |
| **Frontend Utils** | 95% | 100% for validation |
| **Backend Services** | 85% | 95% for auth, patient, visit |
| **Backend Repositories** | 80% | 90% for patient, visit |
| **Backend API Endpoints** | 90% | 95% for CRUD operations |

### Coverage Reports

**Frontend:**
```bash
npm run test:coverage

# View HTML report
open coverage/index.html
```

**Backend:**
```bash
composer test:coverage

# View HTML report
open coverage/html/index.html
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run linter
        working-directory: frontend
        run: npm run lint

      - name: Run type check
        working-directory: frontend
        run: npm run type-check

      - name: Run unit tests
        working-directory: frontend
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend

  backend-tests:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: piclinic_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mysqli, mbstring
          coverage: xdebug

      - name: Install dependencies
        working-directory: www/html/api
        run: composer install --prefer-dist --no-progress

      - name: Setup test database
        run: |
          mysql -h 127.0.0.1 -u root -proot piclinic_test < sql/piclinic.sql
          mysql -h 127.0.0.1 -u root -proot piclinic_test < sql/TestClinics.sql

      - name: Run PHPStan
        working-directory: www/html/api
        run: vendor/bin/phpstan analyse

      - name: Run PHPUnit
        working-directory: www/html/api
        run: vendor/bin/phpunit --coverage-clover=coverage.xml
        env:
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASS: root
          DB_NAME: piclinic_test

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./www/html/api/coverage.xml
          flags: backend

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Install Playwright
        working-directory: frontend
        run: npx playwright install --with-deps

      - name: Run E2E tests
        working-directory: frontend
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Frontend tests
cd frontend
npm run lint
npm run type-check
npm run test:changed

# Backend tests (fast unit tests only)
cd ../www/html/api
vendor/bin/phpstan analyse
vendor/bin/phpunit --testsuite=Unit
```

---

## Testing Best Practices

### 1. Test Naming Convention

```typescript
// ❌ Bad
it('test 1', () => { /* ... */ });

// ✅ Good
it('should display error message when form is submitted with empty required fields', () => {
  /* ... */
});
```

### 2. AAA Pattern (Arrange, Act, Assert)

```typescript
it('should create patient when valid data is submitted', async () => {
  // Arrange
  const patientData = { /* ... */ };
  const mockOnSubmit = vi.fn();

  // Act
  render(<PatientForm onSubmit={mockOnSubmit} />);
  // ... user interactions

  // Assert
  expect(mockOnSubmit).toHaveBeenCalledWith(patientData);
});
```

### 3. Test Independence

```typescript
// ❌ Bad - tests depend on order
let sharedPatient;

it('creates patient', () => {
  sharedPatient = createPatient();
});

it('updates patient', () => {
  updatePatient(sharedPatient); // Depends on previous test
});

// ✅ Good - each test is independent
it('creates patient', () => {
  const patient = createPatient();
  expect(patient).toBeDefined();
});

it('updates patient', () => {
  const patient = createPatient(); // Create own data
  const updated = updatePatient(patient);
  expect(updated).toBeDefined();
});
```

### 4. Mock External Dependencies

```typescript
// ✅ Mock API calls
server.use(
  rest.get('/api/patients/:id', (req, res, ctx) => {
    return res(ctx.json({ data: mockPatient }));
  })
);

// ✅ Mock date/time for consistency
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-03-15'));
```

### 5. Test Error Cases

```typescript
describe('PatientService', () => {
  it('handles success case', () => { /* ... */ });

  // ✅ Also test error cases
  it('handles network error', () => { /* ... */ });
  it('handles 404 not found', () => { /* ... */ });
  it('handles 500 server error', () => { /* ... */ });
  it('handles timeout', () => { /* ... */ });
});
```

---

## Summary

### What to Test

**Frontend:**
- ✅ Component rendering
- ✅ User interactions (clicks, typing, form submission)
- ✅ State changes
- ✅ API integration (mocked)
- ✅ Error handling
- ✅ Accessibility
- ✅ Localization

**Backend:**
- ✅ Business logic (services)
- ✅ Data access (repositories)
- ✅ API endpoints
- ✅ Authentication/authorization
- ✅ Validation
- ✅ Error handling
- ✅ Database queries

### What NOT to Test

- ❌ Third-party library internals
- ❌ CSS styling (use visual regression testing instead)
- ❌ Generated code
- ❌ Simple getters/setters with no logic

---

**Document Version:** 1.0
**Created:** 2026-03-15
**Author:** Claude Code
**Status:** Comprehensive Testing Strategy
