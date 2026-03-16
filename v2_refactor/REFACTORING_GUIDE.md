# piClinc v2.0 Refactoring Guide

**Master Reference Document**

Version: 2.0
Last Updated: 2026-03-15
Status: Active Development Plan

---

## Document Purpose

This is the **master refactoring guide** for piClinc v2.0. It consolidates all planning documents into a single, comprehensive reference that reflects the current prioritized implementation approach.

**What this guide covers:**
- Complete refactoring strategy
- Phased implementation plan
- Technology stack decisions
- Architecture and design patterns
- Testing strategy
- Deployment across all platforms (Pi, Ubuntu, Windows)
- Customer migration approach
- Timeline and resource requirements

**Related detailed documents** (for deep dives):
- `IMPLEMENTATION_PRIORITIES.md` - Detailed phase-by-phase tasks
- `TESTING_STRATEGY.md` - Complete testing patterns and examples
- `MIGRATION_PLAN.md` - Detailed customer migration procedures
- `WINDOWS_DEPLOYMENT.md` - Windows-specific deployment guide
- `REFACTORING_PLAN.md` - Original comprehensive plan (historical)
- `REFACTORING_PLAN_ADDENDUM.md` - Pi 3B+ considerations (historical)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Target Architecture](#target-architecture)
4. [Technology Stack Decisions](#technology-stack-decisions)
5. [Phased Implementation Approach](#phased-implementation-approach)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Strategy](#deployment-strategy)
8. [Migration Strategy](#migration-strategy)
9. [Success Criteria](#success-criteria)
10. [Timeline and Resources](#timeline-and-resources)
11. [Risk Management](#risk-management)
12. [Getting Started](#getting-started)

---

## Executive Summary

### The Opportunity

piClinc is being refactored from a **PHP monolith with server-side rendering** to a **modern React SPA with enhanced PHP backend**. This modernization will deliver:

✅ **Better User Experience** - Modern, fast, responsive interface
✅ **Easier Maintenance** - Clean architecture, better separation of concerns
✅ **Better Testing** - Comprehensive test coverage (80%+)
✅ **Flexible Deployment** - Raspberry Pi, Ubuntu, Windows PC
✅ **Zero Data Loss** - All existing data preserved during migration
✅ **Type Safety** - TypeScript frontend, OpenAPI-generated types

### Critical Constraints

🎯 **Must run on Raspberry Pi 3B+** (1GB RAM)
🎯 **Zero data loss** during customer migrations
🎯 **Minimal downtime** (< 45 minutes per migration)
🎯 **Backward compatibility** during transition
🎯 **Support existing platforms** (Pi, Ubuntu, Windows)

### The Approach

**Pragmatic, Phased Implementation:**

1. **Backend First** - Build solid API foundation on Ubuntu (fast iteration)
2. **Validate on Pi** - Ensure it works on target hardware early
3. **Frontend Development** - Build React UI on desktop browsers (fast iteration)
4. **Cross-Platform Testing** - Validate on all target platforms
5. **Migration Tools** - Automate customer upgrades
6. **Production Release** - v2.0 ready for deployment

**Timeline: 5-6 months** with recommended team (3 developers)

### What Changes vs. What Stays

| Component | v1.x | v2.0 | Change |
|-----------|------|------|--------|
| **Frontend** | PHP SSR | React SPA | Complete rewrite |
| **Backend** | PHP API (partial) | Enhanced PHP API | Refactor + enhance |
| **Database** | MySQL | MySQL | Schema additions only |
| **Platform** | Pi, Ubuntu | Pi, Ubuntu, Windows | Add Windows |
| **Data** | All preserved | All preserved | Zero loss |

---

## Current System Analysis

### Technology Stack (v1.x)

**Frontend:**
- PHP server-side rendering (149 PHP files)
- Minimal JavaScript (ICD-10 autocomplete)
- Custom CSS
- Server generates HTML for each request

**Backend:**
- PHP 8 (updated from PHP 5.6)
- Apache web server
- Partial REST API (49 API files)
- Session-based authentication

**Database:**
- MySQL/MariaDB
- 12 tables, 21 views
- UTF-8 encoding
- Well-normalized schema

**Deployment:**
- Raspberry Pi 3B+ (primary target)
- Ubuntu LTS
- File paths: `/var/www/html/`

### Core Features (v1.x)

**Patient Management:**
- Registration with demographics
- Family grouping
- Medical history (allergies, medications)
- Search by multiple criteria

**Visit Management:**
- Open/close visits
- Complaints and diagnoses
- ICD-10 code integration
- Vitals tracking
- Payment tracking

**Staff Management:**
- 4 access levels (SystemAdmin, ClinicAdmin, ClinicStaff, ClinicReadOnly)
- Multi-language preferences
- User management

**Reporting:**
- Daily logs and payments
- Monthly summaries
- Visit lists
- Customizable date ranges

**Additional:**
- Bilingual (English/Spanish)
- Text messaging
- Workflow tracking
- Context-sensitive help

### Current Architecture Strengths

✅ **Simple and maintainable** - Easy to understand
✅ **Proven on Pi 3B+** - Works on low-resource hardware
✅ **Complete feature set** - Covers clinic workflow
✅ **Good data model** - Well-normalized database
✅ **Localized** - Supports multiple languages

### Current Architecture Limitations

❌ **Tight coupling** - UI and business logic mixed
❌ **Poor testability** - No automated tests
❌ **Slow page loads** - Full page refresh for each action
❌ **Limited type safety** - No TypeScript/static analysis
❌ **Inconsistent API** - Partial, not fully documented

---

## Target Architecture

### Overview

**Modern, Decoupled Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                  Client Browser                      │
│  ┌────────────────────────────────────────────────┐ │
│  │         React SPA (TypeScript)                 │ │
│  │  - Components, Pages, Hooks                    │ │
│  │  - React Query (server state)                  │ │
│  │  - React Router (client routing)               │ │
│  │  - i18next (localization)                      │ │
│  └────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP/JSON
                    │ (REST API)
┌───────────────────▼─────────────────────────────────┐
│                Server (Pi/Ubuntu/Windows)            │
│  ┌────────────────────────────────────────────────┐ │
│  │       Enhanced PHP Backend (v2 API)            │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │ Controllers (API endpoints)               │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │ Services (Business logic)                 │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │ Repositories (Data access)                │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │ Middleware (Auth, Validation, Logging)    │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │           MySQL Database                       │ │
│  │  - 12 core tables (existing)                   │ │
│  │  - New: api_log, migration_log                 │ │
│  │  - Enhanced: audit columns, soft delete        │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Frontend Architecture

**React SPA:**

```
frontend/src/
├── api/                    # API client layer
│   ├── client.ts           # Axios instance + interceptors
│   ├── patients.ts         # Patient API calls
│   ├── visits.ts           # Visit API calls
│   ├── auth.ts             # Authentication
│   └── types.ts            # Auto-generated from OpenAPI
├── components/             # Reusable components
│   ├── common/             # Generic (Button, Input, Table)
│   ├── patients/           # Patient-specific
│   └── visits/             # Visit-specific
├── pages/                  # Page components (routes)
│   ├── Login/
│   ├── Dashboard/
│   ├── Patients/
│   ├── Visits/
│   ├── Reports/
│   └── Admin/
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── usePatients.ts
│   └── useVisits.ts
├── contexts/               # React contexts
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── types/                  # TypeScript types
├── utils/                  # Utilities
└── App.tsx                 # Root component
```

### Backend Architecture

**Enhanced PHP API:**

```
www/html/api/v2/
├── index.php               # API router
├── config/                 # Configuration
│   ├── database.php
│   └── app.php
├── middleware/             # Middleware
│   ├── Auth.php            # JWT/session validation
│   ├── CORS.php            # CORS headers
│   ├── Logger.php          # Request logging
│   └── Validator.php       # Request validation
├── controllers/            # Controllers
│   ├── AuthController.php
│   ├── PatientController.php
│   ├── VisitController.php
│   └── ...
├── services/               # Business logic
│   ├── PatientService.php
│   ├── VisitService.php
│   └── ...
├── repositories/           # Data access
│   ├── PatientRepository.php
│   ├── VisitRepository.php
│   └── ...
├── models/                 # Data models
│   ├── Patient.php
│   └── Visit.php
└── docs/                   # API documentation
    └── openapi.yaml        # Generated from annotations
```

**Layered Architecture Pattern:**

```
Request → Middleware → Controller → Service → Repository → Database
                ↓          ↓           ↓          ↓
              Auth      Validate   Business    Data
              CORS      Format      Logic      Access
              Log       Response
```

### Database Changes

**Additions Only (No Destructive Changes):**

**New Tables:**
```sql
-- Version tracking
CREATE TABLE system_version (
  id INT AUTO_INCREMENT PRIMARY KEY,
  component VARCHAR(50),
  version VARCHAR(20),
  appliedDate DATETIME
);

-- Migration tracking
CREATE TABLE migration_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration VARCHAR(100),
  appliedDate DATETIME,
  status VARCHAR(20)
);

-- API request logging
CREATE TABLE api_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  requestDate DATETIME,
  method VARCHAR(10),
  endpoint VARCHAR(255),
  username VARCHAR(20),
  statusCode INT,
  responseTime INT
);
```

**Enhanced Existing Tables:**
```sql
-- Audit columns
ALTER TABLE patient ADD COLUMN createdBy VARCHAR(20);
ALTER TABLE patient ADD COLUMN modifiedBy VARCHAR(20);

-- Soft delete
ALTER TABLE patient ADD COLUMN deletedAt DATETIME;
ALTER TABLE patient ADD COLUMN deletedBy VARCHAR(20);

-- Performance indexes
ALTER TABLE patient ADD INDEX idx_patient_family (familyID, deletedAt);
ALTER TABLE visit ADD INDEX idx_visit_status_date (visitStatus, dateTimeIn);
```

**Updated Views:**
```sql
-- Exclude soft-deleted records
CREATE OR REPLACE VIEW patientGet AS
SELECT * FROM patient WHERE deletedAt IS NULL;
```

---

## Technology Stack Decisions

### Frontend Stack (Selected)

**Core Framework:**
- ✅ **React 18+** - Mature, widely adopted, great ecosystem
- ✅ **TypeScript** - Type safety, better DX
- ✅ **Vite** - Fast builds, modern tooling

**State Management:**
- ✅ **React Query (TanStack Query)** - Server state, caching, automatic refetch
- ✅ **React Context** - Global UI state (auth, language)
- ✅ **React Hook Form** - Form state management

**Routing:**
- ✅ **React Router v6** - Standard routing solution

**UI Library:**
- 🤔 **Options:** Material-UI, Ant Design, or Custom with Tailwind
- 📋 **Decision needed:** Based on team preference
- 💡 **Recommendation:** Material-UI (MUI) - comprehensive, accessible

**Internationalization:**
- ✅ **react-i18next** - Industry standard, easy migration from PHP

**HTTP Client:**
- ✅ **Axios** - Interceptors, better error handling than fetch

**Testing:**
- ✅ **Vitest** - Fast, Vite-native
- ✅ **React Testing Library** - User-centric testing
- ✅ **MSW** - API mocking
- ✅ **Playwright** - E2E testing

### Backend Stack (Selected)

**Core:**
- ✅ **PHP 8.2+** - Keep existing, proven on Pi 3B+
- ✅ **Apache** - Already configured and working
- ✅ **MySQL/MariaDB** - Existing database

**Rationale for Keeping PHP:**
- ✅ Proven to work on Pi 3B+ (1GB RAM)
- ✅ Lower memory footprint than Node.js
- ✅ Existing codebase to build on
- ✅ Team familiarity
- ✅ No build process needed
- ✅ Can still get type safety via OpenAPI

**New Dependencies:**
```json
{
  "require": {
    "php": ">=8.0",
    "firebase/php-jwt": "^6.0",
    "monolog/monolog": "^3.0",
    "respect/validation": "^2.2",
    "zircote/swagger-php": "^4.0",
    "vlucas/phpdotenv": "^5.5"
  },
  "require-dev": {
    "phpunit/phpunit": "^10.0",
    "phpstan/phpstan": "^1.10"
  }
}
```

### Type Safety Strategy

**Frontend → Backend Type Sharing:**

```
1. Backend: Add OpenAPI annotations to PHP
   @OA\Schema(schema="Patient", ...)

2. Generate OpenAPI spec
   vendor/bin/openapi api/v2 -o openapi.yaml

3. Generate TypeScript types
   npx openapi-typescript openapi.yaml --output src/api/types.ts

4. Use in React
   import { Patient } from '@/api/types';
```

**Result:** Shared types between frontend and backend, validated at build time!

### Platform Support Strategy

**Development Priority:**
1. **Ubuntu Desktop** - Primary development (fast iteration)
2. **Raspberry Pi 3B+** - Target validation (ensure it works)
3. **Desktop Browsers** - Primary UI testing
4. **Windows PC** - Secondary platform (P1)
5. **Pi Browsers** - Constrained testing
6. **Mobile Browsers** - Responsive validation

---

## Phased Implementation Approach

### Overview: 7 Phases, 5-6 Months

```
Phase 0: Foundation (2 weeks)
    ↓
Phase 1: Backend on Ubuntu (6 weeks) - Fast iteration
    ↓
Phase 2: Backend on Pi (2 weeks) - Validate hardware
    ↓
Phase 3: Frontend Core (6 weeks) - Build UI on desktop
    ↓
Phase 4: Frontend Features (3 weeks) - Complete features
    ↓
Phase 5: Cross-Platform Testing (2-3 weeks) - All platforms
    ↓
Phase 6: Migration Tools (3 weeks) - Customer upgrades
    ↓
Phase 7: Production Ready (2 weeks) - Polish & release
```

### Phase 0: Foundation (2 weeks)

**Goal:** Prepare for development

**Key Tasks:**
- Set up Ubuntu development environment
- Install PHP 8.2+, Apache, MySQL, Node.js 18+
- Configure Git repository with branch strategy
- Set up PHPUnit, PHPStan, Vitest
- Add version tracking to v1.x (`system_version` table)
- Create staging environment with test data

**Deliverables:**
- ✅ Working dev environment
- ✅ v1.x tagged as v1.5.0
- ✅ Testing infrastructure ready

### Phase 1: Enhanced PHP Backend (6 weeks)

**Goal:** Build complete, tested API on Ubuntu

**Development Environment:** Ubuntu Desktop (NOT Pi yet)

**Sub-Phases:**

**Week 1-2: Infrastructure**
- Create `/api/v2/` structure
- Set up middleware (auth, validation, logging, CORS)
- Add Composer dependencies
- Configure .env file support
- Set up Swagger/OpenAPI

**Week 2-3: Authentication**
- Refactor auth into Service/Repository/Controller layers
- Endpoints: login, logout, session check
- Unit tests (70%+ coverage)
- Integration tests (full auth flow)

**Week 3-4: Patient API**
- PatientService, PatientRepository, PatientController
- Endpoints: GET, POST, PATCH, DELETE (soft delete)
- Search with exact and fuzzy matching
- OpenAPI annotations
- Unit + integration tests (80%+ coverage)

**Week 4-5: Visit API**
- VisitService, VisitRepository, VisitController
- Endpoints: CRUD, open/close visit, list open visits
- Patient snapshot on visit creation
- Unit + integration tests (80%+ coverage)

**Week 5-6: Supporting APIs & Polish**
- Staff, Clinic, ICD-10, Log, Comment APIs
- Complete OpenAPI specification
- Generate TypeScript types: `npx openapi-typescript openapi.yaml`
- Documentation (Swagger UI at `/api/v2/docs`)
- Performance baseline on Ubuntu

**Deliverables:**
- ✅ Complete backend API
- ✅ 80%+ test coverage
- ✅ OpenAPI spec + TypeScript types
- ✅ API documentation site

**Success Criteria:**
- [ ] All endpoints functional
- [ ] All tests pass
- [ ] No critical security issues (PHPStan level 8)
- [ ] Response times < 200ms on Ubuntu

### Phase 2: Backend Validation on Raspberry Pi (2 weeks)

**Goal:** Prove backend works on target hardware

**Development Environment:** Actual Raspberry Pi 3B+

**Week 1: Deployment & Testing**
- Deploy to Pi 3B+
- Run all unit and integration tests
- Identify and fix Pi-specific issues
- Path/permission fixes

**Week 2: Performance Testing**
- Monitor memory usage (must stay < 700MB)
- Load test (5, 10, 15 concurrent users)
- Measure response times (target: < 500ms)
- Find breaking points
- Optimize if needed (query optimization, caching)
- Document Pi deployment guide

**Deliverables:**
- ✅ Backend running on Pi
- ✅ All tests passing on Pi
- ✅ Performance benchmark report
- ✅ Pi deployment documentation

**Success Criteria:**
- [ ] All tests pass on Pi
- [ ] Response time < 500ms for simple queries
- [ ] Stable under 10 concurrent users
- [ ] Memory < 700MB total
- [ ] 24-hour stability test passes

**Go/No-Go Decision:**
- ✅ **Go** if performance acceptable → proceed to frontend
- ❌ **No-Go** if too slow → optimize, consider Pi 4, or re-architect

### Phase 3: React Frontend - Core (6 weeks)

**Goal:** Build working frontend MVP

**Development Environment:** Desktop browsers (NOT Pi browsers yet)

**Week 1: Foundation**
- Initialize Vite + React + TypeScript
- Install dependencies (React Router, React Query, MUI/Ant Design)
- Set up folder structure
- Import generated TypeScript types from backend
- Create Axios client with interceptors
- Configure react-i18next (convert UIText.csv to JSON)
- Set up Vitest + React Testing Library + MSW

**Week 1-2: Auth & Layout**
- Login page with form validation
- AuthContext and useAuth() hook
- Protected routes
- Layout components (Header, Sidebar, Footer)
- Language switcher
- Tests for auth flow

**Week 2-4: Patient Management**
- Patient search/list page (table, sorting, pagination)
- Patient detail page
- Patient create/edit form (validation with Yup)
- Custom hooks: usePatients(), usePatient(), useCreatePatient()
- Component tests (70%+ coverage)
- Integration tests (user flows)

**Week 4-5: Visit Management**
- Dashboard (open visits list, sortable)
- Visit open page (patient selection, form)
- Visit edit page
- Visit close page
- Visit detail/view page
- ICD-10 autocomplete component (debounced search)
- Custom hooks: useOpenVisits(), useVisit(), useCreateVisit(), useCloseVisit()
- Component tests

**Week 5: Common Components**
- Form components (TextInput, Select, DatePicker, etc.)
- Data display (Table, Card, List)
- Feedback (Toast, Modal, Spinner, Error Boundary)
- Tests for all components

**Week 6: Testing & Polish**
- Complete test coverage (target: 80%+)
- Accessibility audit (keyboard, screen reader, ARIA)
- Performance optimization (code splitting, lazy loading)
- Responsive design (desktop resolutions)
- Error handling polish

**Deliverables:**
- ✅ Working React SPA with core features
- ✅ 80%+ test coverage
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Works on desktop browsers

**Success Criteria:**
- [ ] Login flow works
- [ ] Can CRUD patients
- [ ] Can open/edit/close visits
- [ ] Dashboard shows open visits
- [ ] Fast on desktop (<2s load time)
- [ ] All tests pass

### Phase 4: Frontend Additional Features (3 weeks)

**Goal:** Feature parity with v1.x

**Week 1: Reports**
- Reports page with type selector, date range
- Daily log, daily payment, monthly summary reports
- Table display
- Export to PDF/CSV (if v1.x has this)
- Print view

**Week 2: Admin Functions**
- User management (list, create, edit, deactivate)
- System logs viewer (filter, search, pagination)
- Backup UI (trigger, view history)
- Help content management

**Week 3: Localization & Polish**
- Complete Spanish translations (all strings)
- Language switching (persists)
- UI consistency check
- Loading/empty states
- Success messages
- Final polish

**Deliverables:**
- ✅ All v1.x features implemented
- ✅ Full bilingual support (EN/ES)
- ✅ Admin functions complete

**Success Criteria:**
- [ ] 100% feature parity
- [ ] Both languages tested
- [ ] Reports generate correctly
- [ ] Admin functions work

### Phase 5: Cross-Platform Testing (2-3 weeks)

**Goal:** Validate on all target platforms

**Week 1: Desktop Browsers**
- Chrome/Chromium (latest, previous)
- Firefox (latest, previous)
- Edge (latest) - Windows
- Safari (latest) - Mac if available
- Test all core flows on each
- Document and fix issues

**Week 2: Raspberry Pi Browsers** ⭐
- Chromium on Pi 3B+
- Test all features
- Performance testing (dashboard load time, form responsiveness)
- Memory monitoring
- Long session testing
- Optimize if needed (reduce bundle size, pagination limits)

**Week 3: Mobile/Tablet (P1)**
- Responsive design verification
- iPad, Android tablets
- Touch interface testing
- Mobile browsers (Chrome, Safari, Firefox)

**Deliverables:**
- ✅ Compatibility matrix
- ✅ All critical bugs fixed
- ✅ Performance benchmarks per platform
- ✅ Known issues documented

**Success Criteria:**
- [ ] Works on all desktop browsers
- [ ] Works on Pi Chromium
- [ ] Dashboard loads < 3s on Pi
- [ ] Mobile responsive (minor issues OK)

### Phase 6: Migration & Deployment Tools (3 weeks)

**Goal:** Automate customer upgrades

**Week 1: Database Migrations**
- Create all migration SQL files (audit columns, soft delete, indexes, new tables)
- Rollback scripts for each migration
- Migration runner script (Bash + PowerShell for Windows)
- Verification checks

**Week 2: Deployment Automation**
- Blue-green deployment script (symlinks)
- Configuration migration (dbPass.php → .env)
- Apache configuration updates
- File permissions script
- Automated backup script
- Full rollback script

**Week 3: Testing & Documentation**
- Test migration on staging (Ubuntu and Pi)
- Time the process (target: < 45 minutes)
- Document step-by-step procedures
- Troubleshooting guide
- Create migration package (scripts + docs)

**Deliverables:**
- ✅ Automated migration tooling
- ✅ Tested migration process
- ✅ Migration documentation
- ✅ Rollback verified

**Success Criteria:**
- [ ] Migration works on staging
- [ ] Takes < 45 minutes
- [ ] Rollback works (< 10 minutes)
- [ ] All data preserved
- [ ] Documentation clear

### Phase 7: Production Readiness (2 weeks)

**Goal:** Polish for release

**Week 1: Security & Performance**
- Security audit (PHPStan level 8, SQL injection, XSS, CSRF)
- Penetration testing
- Database query optimization
- API response time tuning
- Frontend bundle optimization
- Caching strategies
- Load testing (Ubuntu and Pi)

**Week 2: Final Testing & Documentation**
- User acceptance testing (real users)
- Collect feedback, fix critical issues
- Documentation review (user guide, admin guide, API docs, deployment guide)
- Training materials (quick start, videos, FAQ)
- Release preparation (version tagging, release notes, changelog)

**Deliverables:**
- ✅ Production-ready v2.0
- ✅ Complete documentation
- ✅ Training materials
- ✅ Security audit passed
- ✅ Performance benchmarks met

**Success Criteria:**
- [ ] No critical security issues
- [ ] Performance ≥ v1.x
- [ ] All docs complete
- [ ] UAT passed
- [ ] Ready for pilot deployment

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /E2E\    10% - Critical user flows (15 scenarios)
      /------\
     /  Integ \  20% - API + Database (50 tests)
    /----------\
   /    Unit    \ 70% - Components, Services, Utils (200+ tests)
  /--------------\
```

**Target Coverage: 80%+ overall**

### Frontend Testing

**Unit Tests (Vitest + React Testing Library):**
```typescript
// Component test example
it('should display error when form submitted with empty required fields', async () => {
  const user = userEvent.setup();
  render(<PatientForm onSubmit={mockSubmit} />);

  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByText(/patient id is required/i)).toBeInTheDocument();
  expect(mockSubmit).not.toHaveBeenCalled();
});
```

**Custom Hook Tests:**
```typescript
// Hook test with React Query + MSW
it('fetches patient by ID', async () => {
  server.use(
    rest.get('/api/v2/patients/P001', (req, res, ctx) => {
      return res(ctx.json({ data: mockPatient }));
    })
  );

  const { result } = renderHook(() => usePatient('P001'), {
    wrapper: createQueryWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(mockPatient);
});
```

**What to Test:**
- ✅ Component rendering and user interactions
- ✅ Form validation and submission
- ✅ State changes
- ✅ API integration (mocked with MSW)
- ✅ Error handling
- ✅ Accessibility

### Backend Testing

**Unit Tests (PHPUnit):**
```php
// Service layer test
public function testGetPatientById_WhenExists_ReturnsPatient(): void
{
    $this->repository
        ->shouldReceive('findById')
        ->once()
        ->with('P001')
        ->andReturn(['clinicPatientID' => 'P001', 'firstName' => 'John']);

    $result = $this->service->getById('P001');

    $this->assertEquals('P001', $result['clinicPatientID']);
}
```

**Integration Tests (with database):**
```php
// API endpoint test
public function testCreatePatient_WithValidData_Returns201(): void
{
    $newPatient = [
        'clinicPatientID' => 'NEW001',
        'firstName' => 'Jane',
        'lastName' => 'Smith',
        'sex' => 'F',
    ];

    $response = $this->post('/api/v2/patients', $newPatient);

    $this->assertResponseStatus(201);
    $this->assertDatabaseHas('patient', ['clinicPatientID' => 'NEW001']);
}
```

**What to Test:**
- ✅ Business logic (services)
- ✅ Data access (repositories)
- ✅ API endpoints (full request/response)
- ✅ Authentication/authorization
- ✅ Validation
- ✅ Error handling

### E2E Testing (Playwright)

**Critical User Flows:**
```typescript
test('complete visit workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'testpass');
  await page.click('button[type="submit"]');

  // Search patient
  await page.fill('[placeholder*="search"]', 'Doe');
  await page.click('button:has-text("Search")');

  // Open visit
  await page.click('a:has-text("Open Visit")');
  await page.fill('[name="primaryComplaint"]', 'Headache');
  await page.click('button:has-text("Save")');

  // Verify visit appears on dashboard
  await expect(page.locator('text=Doe, John')).toBeVisible();
});
```

### Testing Requirements by Phase

| Phase | Required Tests | Coverage Target |
|-------|---------------|----------------|
| Phase 1 (Backend) | Unit + Integration | 80%+ |
| Phase 2 (Pi) | Run all tests on Pi | Same as Phase 1 |
| Phase 3 (Frontend) | Unit + Integration | 80%+ |
| Phase 4 (Features) | Unit + Integration | 80%+ |
| Phase 5 (Cross-platform) | E2E on all platforms | - |
| Phase 7 (Production) | Full test suite + UAT | 80%+ |

---

## Deployment Strategy

### Platform Support Matrix

| Platform | Priority | Use Case | Status |
|----------|----------|----------|--------|
| **Raspberry Pi 3B+** | P0 | Primary target, low-resource clinics | Required |
| **Ubuntu 20.04+** | P0 | Development, larger clinics | Required |
| **Windows 10+** | P1 | PC-based clinics | Supported |
| **Raspberry Pi 4** | P2 | Better performance | Compatible |
| **macOS** | P3 | Development only | Not tested |

### Deployment Architecture

**All Platforms:**
```
┌─────────────────────────────────────┐
│  Web Server (Apache)                 │
│  ┌───────────────────────────────┐  │
│  │  Static Files: React SPA       │  │
│  │  /var/www/html/app/            │  │
│  │  (or C:\xampp\htdocs\app\)     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  PHP Backend: Enhanced API     │  │
│  │  /var/www/html/api/v2/         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ▼
┌─────────────────────────────────────┐
│  MySQL Database                      │
│  - piclinic database                 │
│  - CTS-user                          │
└─────────────────────────────────────┘
```

### Linux/Pi Deployment

**Installation:**
```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install apache2 mysql-server php8.2 php8.2-mysql

# 2. Deploy application
sudo rsync -av www/html/ /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# 3. Deploy React build
sudo mkdir -p /var/www/html/app
sudo cp -r frontend/dist/* /var/www/html/app/

# 4. Configure Apache
sudo a2enmod rewrite
sudo systemctl restart apache2

# 5. Import database
mysql -u CTS-user -p piclinic < sql/piclinic.sql
```

**Blue-Green Deployment (Zero Downtime):**
```bash
# Keep v1 and v2 installed, switch via symlink
/var/www/
├── html → piclinic-v2     # Active (symlink)
├── piclinic-v1/           # Rollback available
└── piclinic-v2/           # New version

# Switch to v2 (< 5 seconds)
sudo ln -sfn /var/www/piclinic-v2 /var/www/html
sudo systemctl restart apache2

# Rollback to v1 (< 5 seconds)
sudo ln -sfn /var/www/piclinic-v1 /var/www/html
sudo systemctl restart apache2
```

### Windows Deployment

**Stack: XAMPP (Recommended)**
- Apache + MySQL + PHP bundled
- GUI control panel
- Easier for non-technical users

**Installation:**
```powershell
# 1. Install XAMPP
# Download from https://www.apachefriends.org/

# 2. Deploy application
Copy-Item -Path www\html\* -Destination C:\xampp\htdocs\piclinic\ -Recurse

# 3. Deploy React build
New-Item -ItemType Directory -Path C:\xampp\htdocs\piclinic\app
Copy-Item -Path frontend\dist\* -Destination C:\xampp\htdocs\piclinic\app\ -Recurse

# 4. Import database (via phpMyAdmin or command line)
C:\xampp\mysql\bin\mysql.exe -u root -p piclinic < piclinic.sql

# 5. Start services (XAMPP Control Panel)
# Click "Start" for Apache and MySQL
```

**Network Access Configuration:**
```powershell
# Configure Windows Firewall
New-NetFirewallRule -DisplayName "piClinc Apache" `
    -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Access from other PCs: http://192.168.1.100/piclinic/
```

### Cross-Platform Configuration

**Platform Detection:**
```php
<?php
// config/platform.php
$isWindows = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN');

if ($isWindows) {
    define('API_LOG_FILEPATH', 'C:/piclinic/logs/', false);
    define('API_IMAGE_FILEPATH', 'C:/piclinic/images/', false);
} else {
    define('API_LOG_FILEPATH', '/var/log/piclinic/', false);
    define('API_IMAGE_FILEPATH', '/var/local/piclinic/images/', false);
}
```

**Or use .env file (preferred):**
```ini
# .env (Linux)
PICLINIC_LOG_PATH=/var/log/piclinic/
PICLINIC_IMAGE_PATH=/var/local/piclinic/images/

# .env (Windows)
PICLINIC_LOG_PATH=C:/piclinic/logs/
PICLINIC_IMAGE_PATH=C:/piclinic/images/
```

---

## Migration Strategy

### Migration Approach: Zero Data Loss, Minimal Downtime

**Timeline per Installation: < 45 minutes**

```
Old Installation (v1.x)
    ↓ Backup (5 min)
    ↓ Database Migration (2-5 min)
    ↓ Deploy v2.0 (5-10 min)
    ↓ Switch (< 5 seconds)
    ↓ Verify (5 min)
New Installation (v2.0)
```

### Database Migration Philosophy

**Rules:**
1. ✅ **Never drop columns** (mark as deprecated instead)
2. ✅ **Never drop tables** (rename to `_deprecated`)
3. ✅ **Always add with DEFAULT values**
4. ✅ **Create indexes without locking** (ALGORITHM=INPLACE)
5. ✅ **Keep views backward compatible**

**Sample Migrations:**

```sql
-- Migration 001: Add audit columns
ALTER TABLE patient
  ADD COLUMN createdBy VARCHAR(20) NULL,
  ADD COLUMN modifiedBy VARCHAR(20) NULL;

-- Migration 002: Add soft delete
ALTER TABLE patient
  ADD COLUMN deletedAt DATETIME NULL,
  ADD COLUMN deletedBy VARCHAR(20) NULL;

-- Update views to exclude soft-deleted
CREATE OR REPLACE VIEW patientGet AS
SELECT * FROM patient WHERE deletedAt IS NULL;

-- Migration 003: Add indexes (no locking)
ALTER TABLE patient
  ADD INDEX idx_patient_family (familyID, deletedAt) ALGORITHM=INPLACE;
```

### Migration Workflow

**Automated Script (7 Steps):**

```bash
#!/bin/bash
# tools/full-migration.sh

echo "Step 1/7: Pre-Migration Assessment"
bash tools/pre-migration-check.sh

echo "Step 2/7: Creating Backup"
mysqldump -u CTS-user -p piclinic | gzip > backup.sql.gz
tar -czf backup-files.tar.gz /var/www/html

echo "Step 3/7: Data Integrity Check"
mysql -u CTS-user -p piclinic < tools/data-integrity-check.sql

echo "Step 4/7: Database Migration"
cd sql/migrations && bash migrate.sh && cd ../..

echo "Step 5/7: Deploying Application"
bash tools/deploy-v2.sh
bash tools/migrate-config.sh

echo "Step 6/7: Pre-Cutover Verification"
curl -s http://localhost/api/v2/health || exit 1

echo "Step 7/7: Switching to v2.0"
bash tools/switch-to-v2.sh

echo "Migration Complete!"
```

### Rollback Procedure

**One Command Rollback:**
```bash
#!/bin/bash
# tools/rollback-migration.sh

# 1. Switch application back
sudo ln -sfn /var/www/piclinic-v1 /var/www/html
sudo systemctl restart apache2

# 2. Rollback database
cd sql/migrations && bash rollback.sh && cd ../..

# 3. Verify
curl -s http://localhost/clinicDash.php | grep -q "Clinic" && echo "✓ Rollback successful"
```

**Rollback Time: < 10 minutes**

### Customer Communication Templates

**Pre-Migration (1 week before):**
```
Subject: piClinc v2.0 Upgrade - Important Information

We are excited to announce piClinc v2.0, a major upgrade that brings:
✓ Modern, faster user interface
✓ Improved performance and reliability

Migration Date: [DATE]
Estimated Downtime: 30-45 minutes
Data: All your patient and visit data will be preserved

BEFORE MIGRATION:
1. Complete any open visits
2. Ensure all staff log out
3. Notify us of any custom modifications
```

**Post-Migration:**
```
Subject: piClinc v2.0 Upgrade Complete ✓

Your piClinc system has been successfully upgraded to v2.0.

WHAT'S NEW:
• Faster, more responsive interface
• Improved patient search
• Better visit workflow

NEXT STEPS:
1. Log in with your existing credentials
2. Watch the 5-minute intro video: [LINK]
```

---

## Success Criteria

### Phase-Level Success Criteria

**Phase 0 (Foundation):**
- [ ] Dev environment configured
- [ ] Can run v1.x on Ubuntu
- [ ] Version tracking in place

**Phase 1 (Backend Ubuntu):**
- [ ] All core API endpoints functional
- [ ] 80%+ test coverage
- [ ] OpenAPI spec generated
- [ ] Response times < 200ms on Ubuntu

**Phase 2 (Backend Pi):**
- [ ] All tests pass on Pi 3B+
- [ ] Response times < 500ms on Pi
- [ ] Memory usage < 700MB
- [ ] Stable for 24 hours

**Phase 3 (Frontend Core):**
- [ ] Login, patient, visit management working
- [ ] 80%+ test coverage
- [ ] Fast on desktop browsers

**Phase 4 (Frontend Features):**
- [ ] 100% feature parity with v1.x
- [ ] Both languages complete (EN/ES)

**Phase 5 (Cross-Platform):**
- [ ] Works on all P0 browsers
- [ ] Works on Pi Chromium
- [ ] Dashboard loads < 3s on Pi

**Phase 6 (Migration):**
- [ ] Migration tested and working
- [ ] Takes < 45 minutes
- [ ] Rollback verified

**Phase 7 (Production):**
- [ ] Security audit passed
- [ ] Performance meets targets
- [ ] UAT passed
- [ ] Documentation complete

### Overall v2.0 Success Criteria

**Functionality:**
- [ ] 100% feature parity with v1.x
- [ ] All P0 and P1 features implemented
- [ ] Bilingual (EN/ES) working

**Quality:**
- [ ] 80%+ code coverage (backend + frontend)
- [ ] No critical bugs
- [ ] Passes security audit (PHPStan level 8)
- [ ] Accessible (WCAG 2.1 AA)

**Performance:**
- [ ] Dashboard < 2s on desktop
- [ ] Dashboard < 3s on Pi 3B+
- [ ] API < 500ms response time
- [ ] Supports 10+ concurrent users on Pi

**Compatibility:**
- [ ] Raspberry Pi 3B+ ✅
- [ ] Ubuntu 20.04+ ✅
- [ ] Windows 10+ ✅
- [ ] Chrome, Firefox, Edge ✅
- [ ] Mobile responsive ✅

**Deployment:**
- [ ] Migration from v1.x works
- [ ] < 45 minute migration time
- [ ] Rollback capability verified
- [ ] Documentation complete

---

## Timeline and Resources

### Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Foundation | 2 weeks | 2 weeks |
| Phase 1: Backend Ubuntu | 6 weeks | 8 weeks |
| Phase 2: Backend Pi | 2 weeks | 10 weeks |
| Phase 3: Frontend Core | 6 weeks | 16 weeks |
| Phase 4: Frontend Features | 3 weeks | 19 weeks |
| Phase 5: Cross-Platform | 2-3 weeks | 21-22 weeks |
| Phase 6: Migration Tools | 3 weeks | 24-25 weeks |
| Phase 7: Production Ready | 2 weeks | 26-27 weeks |

**Total: 26-27 weeks (6-7 months) with recommended team**

### Resource Requirements

**Minimum Team (extends timeline to 8+ months):**
- 1 Full-stack developer

**Recommended Team (5-6 months):**
- 1 Backend developer (PHP)
- 2 Frontend developers (React)
- 1 QA/Tester (part-time in Phases 3-7)

**Optimal Team (4-5 months):**
- 2 Backend developers
- 3 Frontend developers
- 1 Full-time QA
- 1 DevOps/deployment specialist

**Parallel Work Opportunities:**
- Frontend (Phase 3) can start while Pi testing (Phase 2) is ongoing
- Reduces timeline by 2 weeks with proper team coordination

### Hardware Requirements

**Development:**
- 2-3 Ubuntu laptops/desktops (development machines)
- 1 Raspberry Pi 3B+ (testing)
- 1 Windows PC (for Windows testing)

**Testing:**
- 1-2 tablets
- 1-2 mobile phones
- Additional browsers

**Staging:**
- 1 Ubuntu server or Pi (staging environment)

---

## Risk Management

### Critical Risks

| Risk | Impact | Likelihood | Mitigation | Status |
|------|--------|------------|------------|--------|
| **Backend too slow on Pi 3B+** | High | Medium | Test early (Phase 2), optimize, consider Pi 4 | Phase 2 validation |
| **React bundle too large for Pi** | High | Medium | Code splitting, monitor bundle size, test early | Phase 5 testing |
| **Migration loses data** | Critical | Low | Extensive testing, rollback plan, backups | Phase 6 validation |
| **Team members leave** | High | Medium | Documentation, code reviews, knowledge sharing | Ongoing |
| **Timeline slips** | Medium | High | Phased approach allows partial delivery | Managed by phases |

### Risk Response Plans

**If Backend Too Slow on Pi:**
1. Optimize queries (add indexes, use views)
2. Implement caching (APCu, Redis)
3. Reduce concurrent request handling
4. As last resort: Require Pi 4 (8GB RAM)

**If React Bundle Too Large:**
1. Code splitting by route
2. Lazy loading components
3. Tree shaking optimization
4. Remove unused dependencies
5. Consider server-side rendering for initial load

**If Migration Issues:**
1. Comprehensive pre-migration testing
2. Rollback plan tested and documented
3. Pilot migration on non-critical site
4. Support team ready during migrations

---

## Getting Started

### Immediate Next Steps (Week 1)

**For Project Manager:**
1. ✅ Review this guide with stakeholders
2. ✅ Approve technology stack decisions
3. ✅ Assemble team (minimum 3 developers)
4. ✅ Procure hardware (if needed)
5. ✅ Set up project tracking (GitHub Projects, Jira, etc.)

**For Developers:**
1. ✅ Set up Ubuntu development environment
2. ✅ Clone repository, install dependencies
3. ✅ Run existing v1.x locally
4. ✅ Familiarize with current codebase
5. ✅ Review detailed implementation priorities (`IMPLEMENTATION_PRIORITIES.md`)

**For QA/Testing:**
1. ✅ Review testing strategy (`TESTING_STRATEGY.md`)
2. ✅ Set up test environment
3. ✅ Prepare test data and scenarios
4. ✅ Install testing tools (Postman, browsers)

### Week 2 Goals (Phase 0)

- [ ] Dev environment fully configured
- [ ] Git repository structured (main, develop, feature branches)
- [ ] Testing frameworks installed (PHPUnit, PHPStan, Vitest)
- [ ] v1.x tagged as v1.5.0 with version tracking
- [ ] Staging environment ready
- [ ] Team has access to all documentation

### Phase 1 Kickoff (Week 3)

- [ ] Begin backend refactoring
- [ ] Create `/api/v2/` structure
- [ ] Set up CI/CD pipeline
- [ ] Daily standups established
- [ ] Code review process in place

### Decision Points

**Now (Before Starting):**
- [ ] UI library choice (Material-UI, Ant Design, or Tailwind)
- [ ] Confirm team size and timeline
- [ ] Approve budget for hardware/tools

**After Phase 2 (Week 10):**
- [ ] Go/No-Go based on Pi performance
- [ ] Adjust timeline if needed

**After Phase 5 (Week 22):**
- [ ] Pilot clinic selection for first migration
- [ ] Final timeline for production release

---

## Appendices

### Appendix A: Related Documents

**Detailed Phase Breakdown:**
- `IMPLEMENTATION_PRIORITIES.md` - Week-by-week task breakdown

**Testing Deep Dive:**
- `TESTING_STRATEGY.md` - Complete testing patterns and code examples

**Customer Migration:**
- `MIGRATION_PLAN.md` - Detailed migration procedures and scripts

**Platform-Specific:**
- `WINDOWS_DEPLOYMENT.md` - Windows installation and configuration

**Historical Reference:**
- `REFACTORING_PLAN.md` - Original comprehensive plan
- `REFACTORING_PLAN_ADDENDUM.md` - Pi 3B+ constraints analysis

### Appendix B: Quick Reference

**Technology Stack at a Glance:**
```
Frontend:  React 18 + TypeScript + Vite
State:     React Query + Context
UI:        Material-UI (or Ant Design)
Testing:   Vitest + RTL + Playwright
i18n:      react-i18next

Backend:   PHP 8.2 + Apache + MySQL
Arch:      Controller → Service → Repository
Testing:   PHPUnit + PHPStan
Docs:      OpenAPI (swagger-php)

Platforms: Pi 3B+, Ubuntu 20.04+, Windows 10+
```

**Key Commands:**
```bash
# Backend
composer install
composer test
vendor/bin/phpstan analyse

# Frontend
npm install
npm run dev
npm run build
npm test

# OpenAPI
vendor/bin/openapi api/v2 -o openapi.yaml
npx openapi-typescript openapi.yaml --output src/api/types.ts

# Migration
bash tools/full-migration.sh
bash tools/rollback-migration.sh
```

**Key Metrics:**
```
Test Coverage:     80%+
Backend Response:  < 500ms (Pi), < 200ms (Ubuntu)
Frontend Load:     < 3s (Pi), < 2s (Ubuntu)
Migration Time:    < 45 minutes
Rollback Time:     < 10 minutes
Memory Usage:      < 700MB (Pi), < 800MB total
```

### Appendix C: Glossary

**Terms:**
- **Blue-Green Deployment:** Keep two versions installed, switch between them via symlinks
- **Soft Delete:** Mark records as deleted without removing from database
- **SSR:** Server-Side Rendering (v1.x approach)
- **SPA:** Single-Page Application (v2.0 approach)
- **OpenAPI:** API specification standard (formerly Swagger)
- **MSW:** Mock Service Worker - API mocking for tests
- **React Query:** Server state management library

**Acronyms:**
- **P0/P1/P2:** Priority levels (0=critical, 1=high, 2=medium, 3=low)
- **CRUD:** Create, Read, Update, Delete
- **API:** Application Programming Interface
- **UI/UX:** User Interface / User Experience
- **UAT:** User Acceptance Testing
- **E2E:** End-to-End (testing)
- **CI/CD:** Continuous Integration / Continuous Deployment

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2026-03-15 | Consolidated master guide created | Claude Code |
| 1.0 | 2026-03-15 | Initial documents (now superseded) | Claude Code |

---

## Feedback and Updates

This is a **living document**. As the project progresses:

1. **Update this guide** with decisions made
2. **Document deviations** from the plan with rationale
3. **Add lessons learned** after each phase
4. **Keep it current** - this should always reflect reality

**Document Owner:** Project Manager
**Review Frequency:** After each phase completion
**Last Reviewed:** 2026-03-15

---

**Ready to Begin?** Start with Phase 0 tasks in `IMPLEMENTATION_PRIORITIES.md`! 🚀
