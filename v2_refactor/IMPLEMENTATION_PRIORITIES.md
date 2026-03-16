# piClinc Refactoring: Phased Implementation Plan

## Executive Summary

This document defines a **pragmatic, phased approach** to refactoring piClinc from a PHP monolith to a React + Enhanced Backend system. The plan prioritizes:

1. **Backend first** - Get the API solid before building UI
2. **Ubuntu development** - Fast iteration on capable hardware
3. **Pi validation** - Ensure it works on target hardware
4. **Progressive UI development** - Build frontend incrementally
5. **Gradual platform testing** - Desktop first, then constrained devices

**Total Timeline: 5-6 months** (can be parallelized with multiple developers)

---

## Table of Contents

1. [Priority Levels Definition](#priority-levels-definition)
2. [Phase Overview](#phase-overview)
3. [Detailed Phase Breakdown](#detailed-phase-breakdown)
4. [Feature Priority Matrix](#feature-priority-matrix)
5. [Resource Requirements](#resource-requirements)
6. [Success Criteria](#success-criteria)
7. [Risk Management](#risk-management)

---

## Priority Levels Definition

### P0 - Critical (MVP)
**Must have for initial release**
- Core patient management
- Core visit management
- Authentication/authorization
- Basic reporting
- Data integrity
- Works on Pi 3B+ and Ubuntu

### P1 - High Priority
**Should have for v2.0 release**
- All existing v1.x features
- Enhanced reporting
- Admin functions
- Complete localization (EN/ES)
- Windows support
- Migration tools

### P2 - Medium Priority
**Nice to have for v2.0, can be v2.1**
- Advanced features
- Performance optimizations
- Enhanced mobile support
- Additional languages

### P3 - Low Priority (Future)
**Post v2.0 enhancements**
- New features not in v1.x
- Mobile apps
- Cloud deployment options
- Advanced analytics

---

## Phase Overview

```
Timeline:  Month 1  Month 2  Month 3  Month 4  Month 5  Month 6
          ├────────┼────────┼────────┼────────┼────────┼────────┤
Phase 0   ██                                                      Foundation
Phase 1   ███████████████                                         Backend (Ubuntu)
Phase 2          ████████                                         Backend (Pi Test)
Phase 3                  ████████████████                         Frontend (Desktop)
Phase 4                              ████████                     Frontend Features
Phase 5                                      ██████               Cross-Platform Test
Phase 6                                          ██████           Migration Tools
Phase 7                                              ██████       Production Ready
```

**Parallel Tracks Possible:**
- Phase 3 (Frontend) can start while Phase 2 (Pi testing) is ongoing
- Testing phases overlap with development

---

## Detailed Phase Breakdown

## Phase 0: Foundation & Preparation

**Duration:** 2 weeks
**Priority:** P0
**Team:** 1 developer
**Development Environment:** Ubuntu Desktop/Laptop

### Goals
- Set up development infrastructure
- Establish coding standards
- Prepare v1.x for migration tracking
- Create development/testing workflow

### Tasks

#### Week 1: Development Environment

- [ ] **Set up Ubuntu development machine**
  - Install PHP 8.2+, Apache, MySQL
  - Install Node.js 18+, npm
  - Install Composer
  - Configure Git

- [ ] **Set up code repository**
  - Create branch strategy (main, develop, feature/*, release/*)
  - Set up .gitignore
  - Configure git hooks (pre-commit linting)

- [ ] **Set up testing infrastructure**
  - Install PHPUnit
  - Install PHPStan
  - Install Vitest for frontend (prepare for Phase 3)
  - Configure test databases

- [ ] **Set up documentation**
  - Initialize wiki or docs folder
  - Set up API documentation framework (swagger-php)

#### Week 2: v1.x Preparation

- [ ] **Add version tracking to v1.x**
  - Create `system_version` table
  - Add `version.php` to codebase
  - Tag current version as v1.5.0

- [ ] **Add migration tracking**
  - Create `migration_log` table
  - Prepare for future migrations

- [ ] **Audit current codebase**
  - Document all API endpoints
  - Document database schema
  - Identify custom modifications
  - List all dependencies

- [ ] **Set up staging environment**
  - Clone production data to test database
  - Set up test clinic data
  - Document test users and credentials

### Deliverables
- ✅ Working Ubuntu development environment
- ✅ Git repository with branches
- ✅ Testing framework configured
- ✅ v1.5.0 tagged with version tracking
- ✅ Development and testing documentation

### Success Criteria
- [ ] Can run existing v1.x on Ubuntu dev machine
- [ ] Can run unit tests (even if empty)
- [ ] Version tracking queries work
- [ ] Staging database accessible

---

## Phase 1: Enhanced PHP Backend (Ubuntu)

**Duration:** 6 weeks
**Priority:** P0 (core), P1 (complete)
**Team:** 2 developers
**Development Environment:** Ubuntu Desktop

### Goals
- Refactor existing API into clean architecture
- Add comprehensive API documentation
- Implement unit and integration tests
- Validate on Ubuntu (fast iteration)
- **NOT testing on Pi yet** (that's Phase 2)

### Sub-Phase 1A: Core Infrastructure (Week 1-2)

#### API Structure Refactoring

- [ ] **Create enhanced API structure**
  - Set up `/api/v2/` directory structure
  - Create base classes (Controller, Service, Repository)
  - Set up middleware (auth, validation, logging, CORS)
  - Implement error handling framework

- [ ] **Add Composer dependencies**
  ```bash
  composer require firebase/php-jwt
  composer require monolog/monolog
  composer require respect/validation
  composer require zircote/swagger-php
  composer require vlucas/phpdotenv
  ```

- [ ] **Configuration management**
  - Create .env file support
  - Auto-detect platform (Windows/Linux)
  - Migrate from hardcoded configs

- [ ] **Logging infrastructure**
  - Set up Monolog
  - Create log rotation
  - API request/response logging

#### OpenAPI Documentation Setup

- [ ] **Install swagger-php**
- [ ] **Add OpenAPI annotations to existing endpoints**
- [ ] **Generate openapi.yaml**
- [ ] **Set up Swagger UI** at `/api/v2/docs`

### Sub-Phase 1B: Authentication & Authorization (Week 2-3)

#### P0: Session-Based Auth (existing, enhanced)

- [ ] **Refactor auth service**
  - `AuthService.php` - business logic
  - `AuthRepository.php` - database access
  - `AuthController.php` - API endpoints

- [ ] **Endpoints:**
  - POST `/api/v2/auth/login` - Login
  - POST `/api/v2/auth/logout` - Logout
  - GET `/api/v2/auth/session` - Check session
  - POST `/api/v2/auth/refresh` - Refresh session

- [ ] **Unit tests**
  - AuthService tests (password validation, session creation)
  - AuthRepository tests (database operations)
  - AuthController tests (API responses)

- [ ] **Integration tests**
  - Full login flow
  - Session persistence
  - Session expiration
  - Invalid credentials

#### P1: JWT Support (optional, can defer to Phase 4)

- [ ] JWT token generation
- [ ] JWT validation middleware
- [ ] Token refresh endpoint

### Sub-Phase 1C: Patient API (Week 3-4)

#### P0: Core Patient Operations

- [ ] **Patient Service Layer**
  - `PatientService.php`
  - Business logic (validation, duplicate checking)
  - Search logic (exact and fuzzy matching)

- [ ] **Patient Repository**
  - `PatientRepository.php`
  - Database queries
  - Use prepared statements

- [ ] **Patient Controller**
  - `PatientController.php`
  - Request validation
  - Response formatting

- [ ] **Endpoints:**
  - GET `/api/v2/patients` - Search patients
  - GET `/api/v2/patients/{id}` - Get patient by ID
  - POST `/api/v2/patients` - Create patient
  - PATCH `/api/v2/patients/{id}` - Update patient
  - DELETE `/api/v2/patients/{id}` - Delete patient (soft delete)

- [ ] **OpenAPI annotations**
- [ ] **Unit tests** (70%+ coverage)
- [ ] **Integration tests** (all CRUD operations)

### Sub-Phase 1D: Visit API (Week 4-5)

#### P0: Core Visit Operations

- [ ] **Visit Service Layer**
  - `VisitService.php`
  - Open/close visit logic
  - Visit validation
  - Patient snapshot on visit creation

- [ ] **Visit Repository**
  - `VisitRepository.php`
  - Complex queries (join with patient)
  - Status filtering

- [ ] **Visit Controller**
  - `VisitController.php`

- [ ] **Endpoints:**
  - GET `/api/v2/visits` - List/search visits
  - GET `/api/v2/visits/{id}` - Get visit details
  - POST `/api/v2/visits` - Create/open visit
  - PATCH `/api/v2/visits/{id}` - Update visit
  - POST `/api/v2/visits/{id}/close` - Close visit
  - GET `/api/v2/visits/open` - Get all open visits

- [ ] **OpenAPI annotations**
- [ ] **Unit tests** (70%+ coverage)
- [ ] **Integration tests**

### Sub-Phase 1E: Supporting APIs (Week 5-6)

#### P0: Essential APIs

- [ ] **Staff API**
  - User management
  - Password changes
  - Profile updates

- [ ] **Clinic API**
  - Clinic information
  - Settings retrieval

- [ ] **ICD-10 API**
  - Search/autocomplete
  - Code validation

#### P1: Additional APIs

- [ ] **Log API** (read-only)
- [ ] **Comment API**
- [ ] **Session management API**

### Sub-Phase 1F: Testing & Documentation (Week 6)

- [ ] **Complete OpenAPI spec**
  - All endpoints documented
  - All schemas defined
  - Example requests/responses

- [ ] **Generate TypeScript types**
  ```bash
  npx openapi-typescript openapi.yaml --output types.ts
  ```

- [ ] **Test coverage report**
  - Target: 80%+ backend coverage
  - Review and fix gaps

- [ ] **API documentation**
  - Swagger UI accessible
  - README for API usage
  - Authentication guide

- [ ] **Performance baseline**
  - Measure response times on Ubuntu
  - Document resource usage
  - Identify bottlenecks

### Deliverables
- ✅ Complete enhanced PHP backend
- ✅ OpenAPI specification (openapi.yaml)
- ✅ Generated TypeScript types
- ✅ 80%+ test coverage
- ✅ API documentation site
- ✅ Performance baseline metrics

### Success Criteria
- [ ] All core endpoints functional on Ubuntu
- [ ] Postman/curl tests pass 100%
- [ ] Unit tests pass with 80%+ coverage
- [ ] API documentation complete
- [ ] TypeScript types generated
- [ ] No critical security issues (PHPStan level 8)

---

## Phase 2: Backend Validation on Raspberry Pi

**Duration:** 2 weeks
**Priority:** P0
**Team:** 1 developer
**Development Environment:** Actual Raspberry Pi 3B+

### Goals
- Validate backend works on Pi 3B+
- Test performance under constraints
- Identify and fix Pi-specific issues
- Establish performance baselines

### Week 1: Deployment & Testing

- [ ] **Deploy to Raspberry Pi 3B+**
  - Install dependencies
  - Configure PHP/Apache/MySQL
  - Copy application code
  - Set up test database

- [ ] **Run all tests on Pi**
  - Unit tests
  - Integration tests
  - Identify any failures

- [ ] **Fix Pi-specific issues**
  - Path issues
  - Permission issues
  - Performance issues

### Week 2: Performance Testing

- [ ] **Resource monitoring**
  - Memory usage under load
  - CPU usage patterns
  - Disk I/O metrics
  - Network latency

- [ ] **Load testing**
  - 5 concurrent users
  - 10 concurrent users
  - Response time measurements
  - Find breaking points

- [ ] **Optimization** (if needed)
  - Query optimization
  - Caching strategies
  - Resource limits

- [ ] **Documentation**
  - Pi deployment guide
  - Performance benchmarks
  - Known limitations
  - Recommended configurations

### Deliverables
- ✅ Backend running on Pi 3B+
- ✅ All tests passing on Pi
- ✅ Performance benchmark report
- ✅ Pi deployment documentation

### Success Criteria
- [ ] All API tests pass on Pi 3B+
- [ ] Response time < 500ms for simple queries
- [ ] System stable under load (10 concurrent users)
- [ ] Memory usage < 700MB total
- [ ] Can run for 24 hours without issues

---

## Phase 3: React Frontend - Core Features (Desktop)

**Duration:** 6 weeks
**Priority:** P0 (core), P1 (complete)
**Team:** 2-3 developers
**Development Environment:** Desktop browsers (Chrome, Firefox)
**NOT testing on Pi browsers yet**

### Sub-Phase 3A: Frontend Foundation (Week 1)

- [ ] **Initialize React project**
  ```bash
  npm create vite@latest frontend -- --template react-ts
  ```

- [ ] **Install core dependencies**
  ```bash
  npm install react-router-dom @tanstack/react-query axios
  npm install react-hook-form yup
  npm install react-i18next i18next
  ```

- [ ] **Choose UI library**
  - Option A: Material-UI (MUI)
  - Option B: Ant Design
  - Option C: Custom with Tailwind CSS
  - **Decision:** [TBD based on team preference]

- [ ] **Set up project structure**
  - Create folder structure (components, pages, hooks, api, etc.)
  - Configure TypeScript paths
  - Set up ESLint and Prettier

- [ ] **API integration layer**
  - Import generated TypeScript types
  - Create Axios instance with interceptors
  - Set up API client functions

- [ ] **Set up i18n**
  - Convert UIText.csv to JSON
  - Configure react-i18next
  - Create language switching mechanism

- [ ] **Testing setup**
  - Configure Vitest
  - Set up React Testing Library
  - Configure MSW for API mocking

### Sub-Phase 3B: Authentication & Layout (Week 1-2)

#### P0: Core Auth UI

- [ ] **Login page**
  - Login form with validation
  - Error handling
  - Remember me option
  - Language selector

- [ ] **Auth context/hook**
  - `useAuth()` hook
  - Session management
  - Token storage (localStorage or httpOnly cookie)
  - Automatic logout on 401

- [ ] **Protected routes**
  - Route guards
  - Redirect to login

- [ ] **Layout components**
  - Header (user info, logout, language)
  - Sidebar navigation
  - Main content area
  - Footer

- [ ] **Tests**
  - Login flow tests
  - Auth context tests
  - Protected route tests

### Sub-Phase 3C: Patient Management (Week 2-4)

#### P0: Core Patient Features

- [ ] **Patient search/list page**
  - Search bar with autocomplete
  - Patient table with sorting
  - Pagination
  - Loading states
  - Error states

- [ ] **Patient detail page**
  - Display all patient information
  - Visit history
  - Edit button
  - Navigation breadcrumbs

- [ ] **Patient form (create/edit)**
  - Form with validation
  - Field-level error messages
  - Async validation (duplicate checking)
  - Save/cancel actions
  - Success/error notifications

- [ ] **Patient hooks**
  - `usePatients()` - search/list
  - `usePatient(id)` - get by ID
  - `useCreatePatient()` - create
  - `useUpdatePatient()` - update
  - All using React Query

- [ ] **Tests**
  - Component tests (70%+ coverage)
  - Integration tests (user flows)
  - Hook tests

### Sub-Phase 3D: Visit Management (Week 4-5)

#### P0: Core Visit Features

- [ ] **Dashboard (open visits)**
  - List of currently open visits
  - Sortable by time, doctor, name
  - Quick actions (view, edit, close)
  - Patient search bar

- [ ] **Visit open page**
  - Select patient
  - Visit form (complaint, vitals, etc.)
  - ICD-10 autocomplete
  - Save and close options

- [ ] **Visit edit page**
  - Edit all visit fields
  - Add diagnosis codes
  - Update vitals
  - Save changes

- [ ] **Visit close page**
  - Review visit details
  - Add final notes
  - Payment information
  - Close confirmation

- [ ] **Visit detail/view page**
  - Read-only visit information
  - Patient snapshot
  - Print option

- [ ] **Visit hooks**
  - `useOpenVisits()` - dashboard
  - `useVisit(id)` - get by ID
  - `useCreateVisit()` - open visit
  - `useUpdateVisit()` - update
  - `useCloseVisit()` - close visit

- [ ] **ICD-10 autocomplete component**
  - Search as you type
  - Debounced API calls
  - Keyboard navigation
  - Multiple selection

- [ ] **Tests**
  - Component tests
  - Visit workflow E2E test
  - Hook tests

### Sub-Phase 3E: Common Components (Week 5)

#### P0: Reusable Components

- [ ] **Form components**
  - TextInput
  - Select/Dropdown
  - DatePicker
  - Checkbox/Radio
  - TextArea

- [ ] **Data display**
  - Table with sorting/pagination
  - Card
  - List
  - Badge/Tag

- [ ] **Feedback**
  - Toast notifications
  - Modal dialogs
  - Loading spinner
  - Error boundary

- [ ] **Navigation**
  - Breadcrumbs
  - Tabs
  - Sidebar menu

- [ ] **Tests for all components**

### Sub-Phase 3F: Testing & Polish (Week 6)

- [ ] **Complete test coverage**
  - Target: 80%+ coverage
  - Fix gaps

- [ ] **Accessibility audit**
  - Keyboard navigation
  - Screen reader support
  - ARIA labels
  - Color contrast

- [ ] **Performance optimization**
  - Code splitting
  - Lazy loading
  - Memoization
  - Bundle size analysis

- [ ] **Responsive design**
  - Desktop (1920x1080, 1366x768)
  - Laptop (1280x720)
  - Test on different resolutions

- [ ] **Error handling**
  - Network error handling
  - Validation error display
  - User-friendly error messages

### Deliverables
- ✅ React SPA with core features
- ✅ TypeScript throughout
- ✅ 80%+ test coverage
- ✅ Accessible UI (WCAG 2.1 AA)
- ✅ Works on desktop browsers

### Success Criteria
- [ ] Can log in and maintain session
- [ ] Can search, create, edit patients
- [ ] Can open, edit, close visits
- [ ] Dashboard shows open visits correctly
- [ ] All user flows tested and working
- [ ] Fast and responsive on desktop
- [ ] All tests passing

---

## Phase 4: Frontend Additional Features

**Duration:** 3 weeks
**Priority:** P1
**Team:** 2 developers
**Development Environment:** Desktop browsers

### Week 1: Reports

- [ ] **Reports page/section**
  - Report type selector
  - Date range picker
  - Filter options
  - Generate button

- [ ] **Report display**
  - Table view
  - Export to PDF/CSV (if v1.x has this)
  - Print view

- [ ] **Report types** (from v1.x)
  - Daily log
  - Daily payment
  - Monthly summary
  - Visit list
  - Patient summary

### Week 2: Admin Functions

- [ ] **User management** (admin only)
  - List users
  - Create user
  - Edit user
  - Deactivate user
  - Reset password

- [ ] **System logs viewer**
  - Filter by date, level, user
  - Search logs
  - Pagination

- [ ] **Backup/restore UI**
  - Trigger backup
  - View backup history
  - Download backup

- [ ] **Help content management**
  - Edit help text
  - Localized help

### Week 3: Localization & Polish

- [ ] **Complete Spanish translations**
  - All UI strings
  - Error messages
  - Validation messages
  - Help text

- [ ] **Language switching**
  - Persists across sessions
  - Updates all UI immediately

- [ ] **Final polish**
  - UI consistency check
  - Branding/styling
  - Loading states
  - Empty states
  - Success messages

### Deliverables
- ✅ Complete feature parity with v1.x
- ✅ Full bilingual support (EN/ES)
- ✅ Admin functions
- ✅ Reporting system

### Success Criteria
- [ ] All v1.x features implemented
- [ ] Both languages complete and tested
- [ ] Reports generate correctly
- [ ] Admin functions work for all roles

---

## Phase 5: Cross-Platform Testing

**Duration:** 2-3 weeks
**Priority:** P0 (desktop/Pi browsers), P1 (mobile)
**Team:** 2 QA + 1 developer

### Week 1: Desktop Browser Testing

- [ ] **Chrome/Chromium**
  - Latest version
  - Previous version
  - Linux, Windows, Mac

- [ ] **Firefox**
  - Latest version
  - Previous version
  - Linux, Windows, Mac

- [ ] **Edge** (Windows)
  - Latest version

- [ ] **Safari** (Mac - if available)
  - Latest version

- [ ] **Test matrix**
  - Core user flows on each browser
  - Document issues
  - Fix critical bugs

### Week 2: Raspberry Pi Browser Testing

**Now testing on actual Pi 3B+ browsers**

- [ ] **Chromium on Pi**
  - Test all features
  - Performance testing
  - Memory usage monitoring

- [ ] **Test scenarios**
  - Multiple tabs open
  - Long sessions
  - Large patient lists
  - Complex forms

- [ ] **Optimization** (if needed)
  - Reduce bundle size
  - Optimize images
  - Lazy loading
  - Pagination limits

### Week 3: Mobile/Tablet Testing (P1)

- [ ] **Responsive design verification**
  - Tablet (iPad, Android tablets)
  - Mobile (phones)

- [ ] **Touch interface**
  - Forms with touch keyboards
  - Touch targets size
  - Gestures

- [ ] **Mobile browsers**
  - Chrome mobile
  - Safari mobile
  - Firefox mobile

### Deliverables
- ✅ Compatibility matrix
- ✅ All critical bugs fixed
- ✅ Performance benchmarks per platform
- ✅ Known issues documented

### Success Criteria
- [ ] Works on all P0 browsers (desktop)
- [ ] Works on Pi Chromium
- [ ] Acceptable performance on Pi (dashboard < 3s)
- [ ] Mobile responsive (P1 - can have minor issues)

---

## Phase 6: Migration & Deployment Tools

**Duration:** 3 weeks
**Priority:** P1
**Team:** 1-2 developers

### Week 1: Database Migrations

- [ ] **Create all migration scripts**
  - Version tracking (already done in Phase 0)
  - Audit columns
  - Soft delete
  - Indexes
  - New tables (if any)

- [ ] **Rollback scripts**
  - For each migration

- [ ] **Migration runner**
  - Bash script
  - PowerShell script (if Windows P1)
  - Verification checks

### Week 2: Deployment Automation

- [ ] **Deployment scripts**
  - Blue-green deployment
  - Configuration migration
  - Apache configuration
  - File permissions

- [ ] **Backup scripts**
  - Automated database backup
  - Configuration backup
  - Scheduled backups

- [ ] **Rollback scripts**
  - Full system rollback
  - Verification

### Week 3: Documentation & Testing

- [ ] **Migration documentation**
  - Step-by-step guide
  - Troubleshooting guide
  - Rollback procedures

- [ ] **Test migration**
  - On staging environment
  - On fresh Pi installation
  - Time the process
  - Document issues

- [ ] **Create migration package**
  - All scripts
  - Documentation
  - Pre-migration checklist

### Deliverables
- ✅ Complete migration tooling
- ✅ Tested migration process
- ✅ Migration documentation
- ✅ Rollback capability verified

### Success Criteria
- [ ] Can migrate from v1.5 to v2.0 in < 45 minutes
- [ ] Can rollback in < 10 minutes
- [ ] All data preserved (verified)
- [ ] Documentation clear for non-technical users

---

## Phase 7: Production Readiness

**Duration:** 2 weeks
**Priority:** P0
**Team:** Full team

### Week 1: Security & Performance

- [ ] **Security audit**
  - PHPStan level 8 (max)
  - SQL injection testing
  - XSS testing
  - CSRF protection
  - Authentication bypass testing
  - Secrets management review

- [ ] **Performance optimization**
  - Database query optimization
  - API response time tuning
  - Frontend bundle optimization
  - Caching strategies

- [ ] **Load testing**
  - On Ubuntu
  - On Raspberry Pi
  - Document limits
  - Identify bottlenecks

### Week 2: Final Testing & Documentation

- [ ] **User acceptance testing**
  - Real users test the system
  - Collect feedback
  - Fix critical issues

- [ ] **Documentation review**
  - User guide
  - Admin guide
  - API documentation
  - Deployment guide
  - Troubleshooting guide

- [ ] **Training materials**
  - Quick start guide
  - Video tutorials
  - FAQ

- [ ] **Release preparation**
  - Version tagging (v2.0.0)
  - Release notes
  - Change log
  - Upgrade guide

### Deliverables
- ✅ Production-ready v2.0
- ✅ Complete documentation
- ✅ Training materials
- ✅ Security audit passed
- ✅ Performance benchmarks met

### Success Criteria
- [ ] No critical security issues
- [ ] Performance meets or exceeds v1.x
- [ ] All documentation complete
- [ ] UAT passed
- [ ] Ready for pilot deployment

---

## Feature Priority Matrix

### MVP Features (P0) - Must Have for v2.0

**Backend:**
- ✅ Authentication (session-based)
- ✅ Patient CRUD
- ✅ Visit CRUD (open/close)
- ✅ ICD-10 search
- ✅ Staff management (basic)
- ✅ OpenAPI documentation

**Frontend:**
- ✅ Login/logout
- ✅ Dashboard (open visits)
- ✅ Patient management (search, create, edit, view)
- ✅ Visit management (open, edit, close, view)
- ✅ ICD-10 autocomplete
- ✅ Basic navigation
- ✅ English UI

**Infrastructure:**
- ✅ Works on Ubuntu
- ✅ Works on Raspberry Pi 3B+
- ✅ Works on desktop browsers
- ✅ 80%+ test coverage

### High Priority Features (P1) - Should Have for v2.0

**Backend:**
- ✅ All v1.x API features
- ✅ Logging API
- ✅ Comment API
- ✅ Enhanced validation

**Frontend:**
- ✅ Reports (all from v1.x)
- ✅ Admin functions (user mgmt, logs, backup)
- ✅ Spanish UI (complete localization)
- ✅ Help system
- ✅ Mobile responsive

**Infrastructure:**
- ✅ Migration tools (fully automated)
- ✅ Windows deployment support
- ✅ Complete documentation

### Medium Priority Features (P2) - Nice to Have

**Backend:**
- JWT authentication (alternative to sessions)
- Advanced caching
- API rate limiting
- Webhook support

**Frontend:**
- Advanced search filters
- Bulk operations
- Dashboard customization
- Dark mode
- Offline support (PWA)

**Infrastructure:**
- Docker deployment
- Cloud hosting support
- CI/CD pipelines
- Automated backups to cloud

### Low Priority Features (P3) - Future

**New Features:**
- Mobile native apps
- Patient portal
- Appointment scheduling
- Lab integration
- Prescription printing
- Photo attachments
- SMS notifications (enhanced)

**Advanced:**
- Real-time collaboration
- Advanced analytics
- Machine learning features
- Multi-clinic federation

---

## Resource Requirements

### Team Composition

**Minimum Team (extends timeline):**
- 1 Full-stack developer: 6-8 months

**Recommended Team (5-6 months):**
- 1 Backend developer (PHP)
- 2 Frontend developers (React)
- 1 QA/Tester (part-time in later phases)

**Optimal Team (4 months):**
- 2 Backend developers
- 3 Frontend developers
- 1 Full-time QA
- 1 DevOps/deployment specialist

### Hardware Requirements

**Development:**
- 2-3 Ubuntu desktops/laptops (developer machines)
- 1 Raspberry Pi 3B+ (for testing)
- 1 Raspberry Pi 4 (optional, for comparison)

**Testing:**
- 1 Windows PC (for Windows testing)
- 1 Mac (optional, for Safari testing)
- 1-2 tablets
- 1-2 mobile phones

**Staging:**
- 1 Ubuntu server or Raspberry Pi (staging environment)
- Mirrors production setup

### Software/Tools

**Development:**
- IDEs: VS Code, PHPStorm, or WebStorm
- Git + GitHub/GitLab
- Postman or Insomnia (API testing)
- Database tools: phpMyAdmin, MySQL Workbench

**Testing:**
- Browsers: Chrome, Firefox, Edge, Safari
- Testing frameworks (included in code)
- Load testing: Apache Bench, k6, or JMeter

**Deployment:**
- CI/CD: GitHub Actions (free) or Jenkins
- Monitoring: Basic server monitoring

---

## Success Criteria

### Phase-Level Success Criteria

**Phase 0:** Development environment ready, v1.x prepared
**Phase 1:** Backend API complete, tested, documented on Ubuntu
**Phase 2:** Backend validated on Pi 3B+, performance acceptable
**Phase 3:** Frontend MVP working on desktop browsers
**Phase 4:** Feature parity with v1.x achieved
**Phase 5:** Works on all target platforms
**Phase 6:** Can migrate existing installations
**Phase 7:** Production-ready, documented, tested

### Overall v2.0 Success Criteria

**Functionality:**
- [ ] 100% feature parity with v1.x
- [ ] All P0 and P1 features implemented
- [ ] Bilingual (EN/ES) fully functional

**Quality:**
- [ ] 80%+ code coverage (backend and frontend)
- [ ] No critical bugs
- [ ] Passes security audit
- [ ] Accessible (WCAG 2.1 AA)

**Performance:**
- [ ] Dashboard loads < 2s on desktop
- [ ] Dashboard loads < 3s on Pi 3B+
- [ ] API response time < 500ms (simple queries)
- [ ] Supports 10+ concurrent users on Pi

**Compatibility:**
- [ ] Works on Raspberry Pi 3B+
- [ ] Works on Ubuntu 20.04+
- [ ] Works on Windows 10+ (P1)
- [ ] Works on Chrome, Firefox, Edge
- [ ] Mobile responsive (tablets and phones)

**Deployment:**
- [ ] Migration from v1.x works
- [ ] Can rollback if needed
- [ ] Migration takes < 45 minutes
- [ ] Documentation complete

**User Acceptance:**
- [ ] Existing users can operate without retraining (similar UX)
- [ ] Performance acceptable to users
- [ ] No data loss in migration
- [ ] Support requests < v1.x levels after 1 month

---

## Risk Management

### High Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Backend too slow on Pi 3B+** | High | Medium | Test early (Phase 2), optimize, consider Pi 4 requirement |
| **React bundle too large for Pi** | High | Medium | Code splitting, tree shaking, monitor bundle size |
| **Migration fails or loses data** | Critical | Low | Extensive testing, rollback plan, backups |
| **Breaking changes in API** | Medium | Medium | Versioning, backward compatibility during transition |
| **Team members leave** | High | Medium | Documentation, code reviews, knowledge sharing |

### Medium Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Timeline slips** | Medium | High | Phased approach allows partial delivery |
| **Scope creep** | Medium | High | Strict priority levels, defer P2/P3 features |
| **Browser compatibility issues** | Medium | Medium | Test early and often, use standard APIs |
| **User resistance to new UI** | Medium | Medium | Training, gradual rollout, keep UX similar |

### Low Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Dependencies break** | Low | Low | Pin versions, test updates before applying |
| **Database migration edge cases** | Medium | Low | Extensive testing, data integrity checks |
| **Localization issues** | Low | Medium | Native speaker review, testing |

---

## Phase Dependencies

```
Phase 0 (Foundation)
    ↓
Phase 1 (Backend Ubuntu) ────────────┐
    ↓                                 ↓
Phase 2 (Backend Pi)            Phase 3 (Frontend Desktop)
    ↓                                 ↓
    └────────→ Phase 4 (Frontend Features)
                    ↓
              Phase 5 (Cross-Platform)
                    ↓
              Phase 6 (Migration Tools)
                    ↓
              Phase 7 (Production)
                    ↓
                 v2.0 Release
```

**Parallel Work Opportunities:**
- Phase 3 (Frontend) can start while Phase 2 (Pi testing) is ongoing
- Frontend developers can work on Phase 3 while backend team does Phase 2
- Phase 6 (Migration) can be developed in parallel with Phase 4/5

---

## Deferred Features (Post v2.0)

These are explicitly **NOT** in the initial 5-6 month timeline:

### Deferred to v2.1 or Later

- **Windows deployment** - Can defer if no immediate Windows users
  - Keep this P1 if you have Windows-based clinics

- **JWT authentication** - Session-based is sufficient for MVP
  - Can add later if needed for mobile apps

- **Advanced reporting** - Basic reports sufficient for v2.0
  - Enhanced visualizations, charts, exports

- **Advanced search** - Basic search is P0
  - Filters, advanced queries, saved searches

- **Offline support (PWA)** - Not critical for v2.0
  - Useful for unreliable internet areas

- **Mobile apps** - Mobile-responsive web is P1
  - Native iOS/Android apps can wait

- **Additional languages** - EN/ES is sufficient
  - French, Portuguese, etc. can be added later

### Explicitly Out of Scope

- Cloud hosting support (can run on-premise only for v2.0)
- Multi-clinic federation/synchronization
- Telemedicine features
- Patient portal
- Appointment scheduling
- Lab/pharmacy integration
- Advanced analytics/reporting

---

## Go/No-Go Decision Points

### After Phase 1 (Backend)
**Decision:** Proceed to Pi testing or iterate on backend?
- ✅ Go if: All tests pass, API documented, 80%+ coverage
- ❌ No-go if: Major architectural issues, poor test coverage

### After Phase 2 (Pi Validation)
**Decision:** Proceed to frontend or re-architect?
- ✅ Go if: Performance acceptable on Pi, no memory issues
- ❌ No-go if: Too slow, won't scale, memory problems
  - **Fallback:** Require Pi 4, or optimize further, or reconsider tech stack

### After Phase 3 (Frontend MVP)
**Decision:** Proceed to full features or iterate on core?
- ✅ Go if: Core flows work, acceptable performance, tests pass
- ❌ No-go if: Major UX issues, too slow, architecture problems

### After Phase 5 (Cross-Platform)
**Decision:** Proceed to production or more testing?
- ✅ Go if: Works on all P0 platforms, performance acceptable
- ❌ No-go if: Critical bugs, platform compatibility issues

### Before v2.0 Release
**Decision:** Release or delay?
- ✅ Go if: All P0/P1 features complete, security audit passed, UAT passed
- ❌ No-go if: Critical bugs, data integrity issues, migration not working

---

## Appendix: Week-by-Week Summary

| Week | Phase | Focus | Deliverable |
|------|-------|-------|-------------|
| 1-2 | 0 | Foundation | Dev environment, v1.x prepared |
| 3-4 | 1A-B | Backend infrastructure, auth | Auth API + tests |
| 5-6 | 1C | Patient API | Patient CRUD + tests |
| 7-8 | 1D | Visit API | Visit CRUD + tests |
| 9-10 | 1E-F | Supporting APIs, docs | Complete backend, OpenAPI |
| 11-12 | 2 | Pi validation | Backend validated on Pi |
| 13-14 | 3A-B | Frontend foundation, auth | Login, layout |
| 15-16 | 3C | Patient UI | Patient management UI |
| 17-18 | 3D-E | Visit UI, components | Visit management UI |
| 19 | 3F | Frontend polish | Frontend MVP complete |
| 20-22 | 4 | Additional features | Reports, admin, localization |
| 23-25 | 5 | Cross-platform testing | Compatibility verified |
| 26-28 | 6 | Migration tools | Migration automated |
| 29-30 | 7 | Production readiness | v2.0 ready |

**Total: 30 weeks (~7 months) with recommended team**
**Can be compressed to 20-24 weeks (~5-6 months) with optimal team**

---

**Document Version:** 1.0
**Created:** 2026-03-15
**Author:** Claude Code
**Status:** Phased Implementation Plan with Priorities
