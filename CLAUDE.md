# piClinic v2.0 Refactor - Development Guide

This file provides guidance for working on the piClinic v2.0 refactor project.

## Project Overview

piClinic is a clinic information system designed for resource-constrained environments. The v2.0 refactor transforms a PHP monolith with server-side rendering into a modern React SPA with an enhanced PHP backend.

**Current State:**
- Version: v1.x (production), v2.0 (in development)
- Status: Active refactoring per phased implementation plan

**Key Documentation:**
- Master plan: `v2_refactor/REFACTORING_GUIDE.md`
- Implementation details: `v2_refactor/IMPLEMENTATION_PRIORITIES.md`
- Testing strategy: `v2_refactor/thoughts/TESTING_STRATEGY.md`

## Branch Strategy

The repository uses three long-lived branches:

| Branch | Purpose |
|--------|---------|
| `main` | v1.x production code. Not modified while v1 systems are running. |
| `main_v2` | Stable v2.0 code. Receives merges from phase branches at phase-end Go/No-Go decisions only. |
| `react-refactor` | Active v2.0 development. Current working branch. |

### Phase Branches

Development work is organized into phase branches that correspond to the phases defined in `v2_refactor/IMPLEMENTATION_PRIORITIES.md`:

```
phase-0-foundation   (complete)
phase-1-backend
phase-2-backend-pi
phase-3-frontend-core
phase-4-frontend-features
phase-5-cross-platform
phase-6-migration
phase-7-production
```

Each phase branch:
- Forks from the previous phase branch
- Contains all work for that phase
- Merges into `main_v2` only at the phase-end Go/No-Go decision point
- Is retained after merging as a historical rollback point

### Merge Policy

- **Phase branch → `main_v2`**: Only at phase-end Go/No-Go. All tests must pass and phase success criteria must be met.
- **`main_v2` → `main`**: Only for the final v2.0 production release (Phase 7 completion).
- **`main` is never modified** during v2 development.

### Current Branch

Check which phase branch you are on before starting any work:

```bash
git branch --show-current
```

## Critical Constraints

These are non-negotiable requirements that must guide all decisions:

1. **Must run on Raspberry Pi 3B+ (1GB RAM)**
   - Backend memory usage must stay under 700MB
   - Frontend bundle must be optimized for low-resource browsers
   - Test on Pi early and often (Phase 2+)

2. **Zero data loss during migration**
   - Never drop columns or tables (mark as deprecated instead)
   - All migrations must have rollback scripts
   - Extensive testing before production deployment

3. **Minimal downtime (< 45 minutes for migration)**
   - Use blue-green deployment strategy
   - Automated migration scripts
   - Quick rollback capability (< 10 minutes)

4. **Backward compatibility during transition**
   - v1.x must continue working until migration
   - Database changes must be additive only
   - API versioning (/api/v2/)

5. **Platform support**
   - P0: Raspberry Pi 3B+, Ubuntu 20.04+
   - P1: Windows 10+
   - P2: Raspberry Pi 4

## Technology Stack

### Frontend (v2.0)
- React 18+ with TypeScript
- Build tool: Vite
- State management: React Query (server state) + Context (UI state)
- Routing: React Router v6
- Forms: React Hook Form
- Validation: Yup
- i18n: react-i18next
- HTTP: Axios
- Testing: Vitest + React Testing Library + Playwright
- UI library: TBD (Material-UI, Ant Design, or Tailwind)

### Backend (v2.0)
- PHP 8.2+ (keep existing for low memory footprint)
- Apache web server
- MySQL/MariaDB
- Architecture: Controller → Service → Repository pattern
- Testing: PHPUnit + PHPStan (level 8)
- Documentation: OpenAPI (swagger-php)
- Dependencies: JWT, Monolog, Respect/Validation, phpdotenv

### Type Safety
- Backend: OpenAPI annotations on PHP code
- Generate: `openapi.yaml` from PHP annotations
- Frontend: TypeScript types auto-generated from OpenAPI spec
- Result: Shared types between frontend and backend

## Architecture Patterns

### Backend Structure
```
www/html/api/v2/
├── index.php           # API router
├── config/            # Configuration
├── middleware/        # Auth, CORS, Logger, Validator
├── controllers/       # HTTP layer, request/response handling
├── services/          # Business logic
├── repositories/      # Data access layer
├── models/            # Data models
└── docs/              # OpenAPI documentation
```

**Pattern to follow:**
```
Request → Middleware → Controller → Service → Repository → Database
```

### Frontend Structure
```
frontend/src/
├── api/              # API client + auto-generated types
├── components/       # Reusable components
│   ├── common/      # Generic (Button, Input, Table)
│   ├── patients/    # Patient-specific
│   └── visits/      # Visit-specific
├── pages/           # Page components (routes)
├── hooks/           # Custom React hooks
├── contexts/        # React contexts
├── types/           # TypeScript types
├── utils/           # Utilities
└── App.tsx          # Root component
```

## Coding Standards

### General Rules
- Write clear, self-documenting code
- Avoid premature optimization (but always consider Pi constraints)
- Prefer explicit over implicit
- No console.log or var_dump in production code
- Use meaningful variable/function names

### PHP Backend
- Follow PSR-12 coding standard
- Use type hints for all function parameters and return types
- Prepare all SQL statements (prevent SQL injection)
- Add OpenAPI annotations to all endpoints
- Validate all input data
- Use dependency injection where appropriate
- Keep controllers thin (business logic goes in services)
- Repository pattern for all database access

**Example controller:**
```php
class PatientController extends BaseController
{
    private PatientService $patientService;

    public function __construct(PatientService $patientService)
    {
        $this->patientService = $patientService;
    }

    /**
     * @OA\Get(
     *     path="/api/v2/patients/{id}",
     *     @OA\Response(response="200", description="Success")
     * )
     */
    public function getById(string $id): JsonResponse
    {
        $patient = $this->patientService->getById($id);
        return $this->json($patient);
    }
}
```

### React Frontend
- Use functional components with hooks (no class components)
- Prefer custom hooks over component logic duplication
- Use React Query for all server state management
- Use Context only for global UI state (auth, language, theme)
- Colocate tests with components
- Use TypeScript strictly (no `any` unless absolutely necessary)
- Prefer composition over prop drilling
- Keep components small and focused
- Memoize expensive computations

**Example component pattern:**
```typescript
// hooks/usePatient.ts
export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientApi.getById(id)
  });
}

// components/patients/PatientDetail.tsx
export function PatientDetail({ id }: Props) {
  const { data: patient, isLoading, error } = usePatient(id);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* patient details */}</div>;
}
```

## Testing Requirements

### Coverage Targets
- Backend: 80%+ test coverage
- Frontend: 80%+ test coverage
- E2E: Critical user flows (15 scenarios)

### Testing Pyramid
```
    /E2E\      10% - Critical flows
   /------\
  /  Integ \ 20% - API + DB integration
 /----------\
/    Unit    \ 70% - Components, Services, Utils
```

### What to Test

**Backend:**
- All service layer business logic (unit tests)
- All repository data access (integration tests)
- All API endpoints (integration tests)
- Authentication/authorization flows
- Validation logic
- Error handling

**Frontend:**
- Component rendering and interactions
- Custom hooks with React Query
- Form validation and submission
- Error states and loading states
- Accessibility (keyboard navigation, ARIA)

**E2E:**
- Complete login flow
- Create/edit patient workflow
- Open/edit/close visit workflow
- Generate reports workflow
- Admin functions workflow

### Testing Commands
```bash
# Backend
composer test                    # Run PHPUnit tests
vendor/bin/phpstan analyse      # Static analysis

# Frontend
npm test                        # Run Vitest tests
npm run test:e2e               # Run Playwright E2E tests
npm run test:coverage          # Coverage report
```

## Database Guidelines

### Migration Rules (Critical)
1. **Never drop columns** - Mark as deprecated, add comment
2. **Never drop tables** - Rename with `_deprecated` suffix
3. **Always add with DEFAULT values** - Avoid breaking v1.x
4. **Create indexes without locking** - Use ALGORITHM=INPLACE
5. **Update views to maintain compatibility**
6. **Every migration must have rollback script**

### Migration Template
```sql
-- Migration: 001_add_audit_columns.sql
ALTER TABLE patient
  ADD COLUMN createdBy VARCHAR(20) NULL DEFAULT NULL,
  ADD COLUMN modifiedBy VARCHAR(20) NULL DEFAULT NULL;

-- Rollback: 001_add_audit_columns_rollback.sql
ALTER TABLE patient
  DROP COLUMN createdBy,
  DROP COLUMN modifiedBy;
```

## Phase-Aware Development

Check current phase in `v2_refactor/IMPLEMENTATION_PRIORITIES.md` before starting work.

### Phase 0: Foundation (Weeks 1-2)
- Development environment setup on Ubuntu
- Testing infrastructure
- Version tracking in v1.x

### Phase 1: Backend on Ubuntu (Weeks 3-10)
- Develop on Ubuntu for fast iteration
- **Do not test on Pi yet** - that's Phase 2
- Focus: API structure, auth, patient/visit APIs, tests
- Deliverable: Complete backend with 80%+ test coverage

### Phase 2: Backend on Pi (Weeks 11-12)
- **Now test on actual Raspberry Pi 3B+**
- Validate performance under constraints
- Memory usage must be < 700MB
- Response times < 500ms for simple queries
- Go/No-Go decision based on Pi performance

### Phase 3: Frontend Core (Weeks 13-19)
- Develop on desktop browsers for fast iteration
- **Do not test on Pi browsers yet** - that's Phase 5
- Focus: Auth, patient management, visit management
- Use auto-generated TypeScript types from backend

### Phase 4: Frontend Features (Weeks 20-22)
- Reports, admin functions, full localization (EN/ES)
- Feature parity with v1.x

### Phase 5: Cross-Platform Testing (Weeks 23-25)
- **Now test on Pi browsers** (Chromium on Pi 3B+)
- Test on all desktop browsers
- Mobile responsive testing
- Optimize if performance issues found

### Phase 6: Migration Tools (Weeks 26-28)
- Automated migration scripts
- Blue-green deployment tooling
- Rollback procedures
- Test migration on staging

### Phase 7: Production Readiness (Weeks 29-30)
- Security audit (PHPStan level 8)
- Performance optimization
- User acceptance testing
- Final documentation

## Common Pitfalls to Avoid

1. **Don't develop on Pi during early phases**
   - Use Ubuntu for fast iteration (Phases 1, 3, 4)
   - Validate on Pi at designated checkpoints (Phases 2, 5)

2. **Don't ignore bundle size**
   - Monitor frontend bundle size continuously
   - Code splitting and lazy loading are essential for Pi
   - Target: < 1MB initial bundle

3. **Don't mix business logic in controllers**
   - Controllers = HTTP layer only
   - Business logic = Services
   - Data access = Repositories

4. **Don't use untyped data between frontend/backend**
   - Always regenerate TypeScript types after API changes
   - Command: `npx openapi-typescript openapi.yaml --output src/api/types.ts`

5. **Don't skip testing**
   - Write tests as you go, not at the end
   - 80% coverage is required, not optional

6. **Don't make breaking database changes**
   - Always additive migrations
   - v1.x must continue working during transition

7. **Don't optimize prematurely**
   - But always keep Pi constraints in mind
   - Profile before optimizing

8. **Don't forget accessibility**
   - Keyboard navigation must work
   - Screen reader compatible
   - WCAG 2.1 AA compliance

## Quick Commands Reference

### Environment Verification
```bash
# Verify the development environment
cd ~/piClinic/tools
python3 checkEnvironment.py
```

### Backend Development
```bash
# Start development server
php -S localhost:8000 -t www/html

# Run tests
composer test
vendor/bin/phpstan analyse --level 8

# Generate OpenAPI spec
vendor/bin/openapi api/v2 -o openapi.yaml

# Database migrations (when ready)
mysql -u CTS-user -p piclinic < sql/migrations/001_migration.sql
```

### Frontend Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:coverage
npm run test:e2e

# Generate types from backend
npx openapi-typescript ../www/html/api/v2/docs/openapi.yaml --output src/api/types.ts

# Type check
npm run type-check

# Lint
npm run lint
```

### Deployment
```bash
# Deploy to staging
bash tools/deploy-staging.sh

# Run migration (when ready)
bash tools/full-migration.sh

# Rollback if needed
bash tools/rollback-migration.sh
```

## Performance Targets

### Raspberry Pi 3B+ Requirements
- Total memory usage: < 700MB (leaves 300MB for OS)
- API response time: < 500ms (simple queries)
- Dashboard load time: < 3s
- Support 10 concurrent users minimum
- 24-hour stability without crashes

### Ubuntu Development
- API response time: < 200ms (simple queries)
- Dashboard load time: < 2s
- Support 20+ concurrent users

## Security Checklist

Before any production deployment:
- [ ] PHPStan level 8 passes with no errors
- [ ] All SQL uses prepared statements
- [ ] All input is validated
- [ ] CSRF protection enabled
- [ ] XSS prevention in place
- [ ] Authentication properly secured
- [ ] No secrets in code (use .env)
- [ ] HTTPS enforced in production
- [ ] Proper CORS configuration

## File Naming Conventions

### Backend
- Controllers: `PascalCase` + `Controller` suffix (e.g., `PatientController.php`)
- Services: `PascalCase` + `Service` suffix (e.g., `PatientService.php`)
- Repositories: `PascalCase` + `Repository` suffix (e.g., `PatientRepository.php`)
- Models: `PascalCase` (e.g., `Patient.php`)
- Tests: Same as source with `Test` suffix (e.g., `PatientServiceTest.php`)

### Frontend
- Components: `PascalCase` (e.g., `PatientForm.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `usePatient.ts`)
- Utils: `camelCase` (e.g., `formatDate.ts`)
- Types: `PascalCase` (e.g., `Patient.ts`)
- Tests: Same as source with `.test` suffix (e.g., `PatientForm.test.tsx`)

## Before Starting Any Task

1. **Check your branch** - Run `git branch --show-current` and confirm you are on the correct phase branch
2. **Read the phase documentation** - Understand current phase requirements
3. **Check existing code** - Look for similar patterns to follow
4. **Consider Pi constraints** - Will this work on low-resource hardware?
5. **Plan for testing** - How will you test this?
6. **Think about types** - Ensure type safety between frontend/backend
7. **If the task is ambiguous**, ask one clarifying question before writing any code.
8. **Review security** - Any injection vulnerabilities?

## When Asking Questions

Prefer to:
1. Check `v2_refactor/REFACTORING_GUIDE.md` first
2. Check `v2_refactor/IMPLEMENTATION_PRIORITIES.md` for phase details
3. Look at existing code for patterns
4. Refer to this CLAUDE.md for standards

## Success Criteria for v2.0

**Functionality:**
- 100% feature parity with v1.x
- Bilingual (English/Spanish) support

**Quality:**
- 80%+ test coverage (backend + frontend)
- No critical bugs
- PHPStan level 8 passes
- WCAG 2.1 AA accessible

**Performance:**
- Works on Raspberry Pi 3B+ with < 700MB memory
- Dashboard < 3s on Pi, < 2s on Ubuntu
- API < 500ms on Pi, < 200ms on Ubuntu

**Compatibility:**
- Raspberry Pi 3B+ ✓
- Ubuntu 20.04+ ✓
- Windows 10+ ✓
- Chrome, Firefox, Edge ✓
- Mobile responsive ✓

**Deployment:**
- Migration from v1.x < 45 minutes
- Rollback capability < 10 minutes
- Zero data loss

---

**Document Version:** 1.1
**Created:** 2026-03-22
**Last Updated:** 2026-04-03
