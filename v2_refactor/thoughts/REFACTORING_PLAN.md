# piClinc Refactoring Plan: React Frontend + Central Backend

## Executive Summary

This document outlines a comprehensive plan to refactor the piClinc clinic management system from a traditional PHP monolith with server-side rendering into a modern **React Single-Page Application (SPA)** with a **centralized REST API backend**.

**Current Architecture:**
- PHP-based server-side rendering (149 PHP files)
- Tightly coupled UI and business logic
- MySQL database with 12 tables, 21 views
- RESTful API partially implemented
- Bilingual support (English/Spanish)

**Target Architecture:**
- React SPA frontend (modern, responsive UI)
- Node.js/Express REST API backend (or keep PHP API enhanced)
- MySQL database (same schema with potential optimizations)
- JWT-based authentication
- Microservices-ready architecture

---

## Part 1: Current System Documentation

### 1.1 Application Overview

**piClinc** is a clinic management system designed for low-resource clinical settings, optimized to run on Raspberry Pi and Ubuntu systems.

**Core Features:**
- Patient registration and management
- Visit/consultation tracking
- Staff management with role-based access
- ICD-10 diagnosis code integration
- Reporting (daily logs, monthly summaries)
- Bilingual UI (English/Spanish)
- Text messaging for patient notifications

### 1.2 Current Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | PHP server-side rendering, HTML, CSS, minimal JavaScript |
| **Backend** | PHP 8, Apache web server |
| **Database** | MySQL/MariaDB |
| **Authentication** | Session-based with tokens |
| **Deployment** | Raspberry Pi, Ubuntu VMs |

### 1.3 Directory Structure

```
piclinic/
├── www/
│   ├── html/              # Main application code
│   │   ├── api/           # REST API handlers (49 files)
│   │   ├── shared/        # Common PHP libraries
│   │   ├── uitext/        # Localized UI strings
│   │   ├── uihelp/        # UI helper scripts (10 files)
│   │   ├── reports/       # Report generation (15 files)
│   │   ├── assets/        # CSS, JavaScript
│   │   └── *.php          # UI pages (~60 files)
│   ├── pass/              # Configuration files (credentials)
│   └── scripts/           # Shell scripts
├── sql/                   # Database schemas
├── tools/                 # Build and setup scripts
├── uitext/                # Source UI text (CSV)
├── postman/               # API tests
├── docs/                  # GitHub Pages documentation
└── notes/                 # Design notes
```

### 1.4 Database Schema

**12 Core Tables:**

1. **staff** - User authentication and profiles
   - Fields: username, password (hashed), firstName, lastName, position, accessGranted, preferredLanguage
   - Access levels: SystemAdmin, ClinicAdmin, ClinicStaff, ClinicReadOnly

2. **session** - Active user sessions
   - Fields: token, username, clinicPublicID, createdDate, lastActivityDate

3. **patient** - Patient demographics
   - Fields: clinicPatientID, familyID, patientNationalID, lastName, firstName, sex, birthDate
   - Medical: allergies, medications, currentMedications, knownConditions
   - Address: homeAddress, neighborhood, city, county, state
   - Family: responsibleParty

4. **visit** - Patient visit records
   - Fields: visitID, patientVisitID, clinicPatientID, visitType, visitStatus
   - Clinical: primaryComplaint, secondaryComplaint, diagnosis, treatment
   - Timing: dateTimeIn, dateTimeOut
   - Staff: staffUsername, staffName, staffPosition
   - Payment: amountPaid, paymentPlan, paymentReason

5. **clinic** - Clinic information
   - Fields: publicID, shortName, longName, location, language

6. **icd10** - ICD-10 diagnosis codes
   - Fields: icd10index, diagnosisCode, shortDescription, longDescription

7. **textmsg** - Text message queue
   - Fields: messageID, textServiceID, messageText, patientID, status

8. **log** - System event logging
   - Fields: date, source, level, message

9. **wflog** - Workflow event logging
   - Fields: date, username, page, workflow, step

10. **comment** - User feedback
    - Fields: date, username, commentText

11. **help** - Context-sensitive help content
    - Fields: pageID, sectionID, language, helpText

12. **monthdays** - Calendar utility table

**21 Database Views:**
- `patientGet`, `patientList` - Patient queries
- `visitGet`, `visitEditGet`, `visitOpen`, `visitToday` - Visit queries
- `visitPatientGet`, `visitPatientEditGet` - Combined visit/patient data
- `staffGetByUser`, `staffGetByName` - Staff lookups
- `icd10Get` - ICD-10 code searches
- `thisClinicGet` - Current clinic info
- And more specialized views for reporting

### 1.5 Current API Structure

Located in `/www/html/api/`, the API follows a RESTful pattern:

**Pattern:** Each resource has separate files for HTTP methods
- `{resource}.php` - Router file (dispatches to method handlers)
- `{resource}_get.php` - GET operations
- `{resource}_post.php` - POST operations
- `{resource}_patch.php` - PATCH operations
- `{resource}_delete.php` - DELETE operations
- `{resource}_common.php` - Shared functions

**Resources:**
- **patient** - Patient CRUD operations
- **visit** - Visit management
- **staff** - Staff management
- **session** - Authentication
- **clinic** - Clinic information
- **icd** - ICD-10 code searches
- **log** - Event logging
- **comment** - User feedback
- **textmsg** - Text messaging
- **locImage** - Image handling

**Authentication:**
- Token-based authentication via `X-piClinic-token` header
- Tokens stored in `session` table
- Session validation on each API call

**Example API Endpoints:**

```
GET  /api/patient.php?clinicPatientID=ABC123
POST /api/patient.php (with JSON body)
PATCH /api/patient.php?clinicPatientID=ABC123 (with JSON body)

GET  /api/visit.php?visitStatus=Open
POST /api/visit.php (create new visit)
PATCH /api/visit.php?patientVisitID=V123 (update visit)
```

### 1.6 Current Frontend Pages

**Authentication:**
- `clinicLogin.php` - Login page

**Dashboard:**
- `clinicDash.php` - Home page (shows open visits)

**Patient Management:**
- `ptInfo.php` - View patient information
- `ptAddEdit.php` - Add/edit patient
- `ptResults.php` - Patient search results

**Visit Management:**
- `visitOpen.php` - Open new visit
- `visitEdit.php` - Edit visit details
- `visitClose.php` - Close visit
- `visitInfo.php` - View visit information

**Administration:**
- `adminHome.php` - Admin dashboard
- `adminShowUsers.php` - User management
- `adminLogViewer.php` - View system logs
- `adminBackup.php` - Database backup
- `adminHelpAddEdit.php` - Help content editor

**Reports:**
- 15 report files for various analytics (daily logs, monthly summaries, etc.)

**UI Helpers:**
- 10 helper scripts in `/uihelp/` for AJAX operations

### 1.7 Localization System

**Current Implementation:**
- Source file: `uitext/UIText.csv` (62KB, ~500+ strings)
- Build tool: `tools/build-uiText.py` (Python script)
- Output: PHP files in `www/html/uitext/` for each page/language combo
- Languages: English (en), Spanish (es), UI test mode (ui)
- Per-user language preference stored in `staff` table

**Text File Pattern:**
```php
// In clinicDashText.php
define('TEXT_CLINIC_DASH_PAGE_TITLE', 'Clinic Dashboard');
define('TEXT_NO_OPEN_VISITS', 'No patients currently admitted');
// etc.
```

### 1.8 Security Features

1. **Authentication:**
   - Session-based with token validation
   - Password hashing using PHP `password_hash()` (bcrypt)
   - Token stored in database session table

2. **Authorization:**
   - Four access levels: SystemAdmin, ClinicAdmin, ClinicStaff, ClinicReadOnly
   - Page-level access control via `uiSessionInfo.php`
   - API-level access control in each endpoint

3. **SQL Injection Protection:**
   - Uses mysqli prepared statements
   - Parameterized queries throughout

4. **Session Management:**
   - Token expiration tracking
   - Last activity timestamp
   - Session cleanup

---

## Part 2: React Frontend Refactoring Plan

### 2.1 Frontend Technology Stack

**Core Framework:**
- **React 18+** - Component-based UI
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server

**State Management:**
- **React Context API** - Global state (auth, user preferences)
- **React Query (TanStack Query)** - Server state management, caching
- **Zustand** (optional) - Simple client state if needed

**Routing:**
- **React Router v6** - Client-side routing

**UI Component Library:**
- **Material-UI (MUI)** or **Ant Design** - Pre-built accessible components
- **Tailwind CSS** - Utility-first CSS framework
- Or keep custom CSS with modern CSS-in-JS solution

**Forms:**
- **React Hook Form** - Performant form handling
- **Yup** or **Zod** - Schema validation

**Internationalization:**
- **react-i18next** - Localization support (English/Spanish)

**HTTP Client:**
- **Axios** - HTTP requests with interceptors
- **React Query** - Built on top of Axios for data fetching

**Date/Time:**
- **date-fns** or **Day.js** - Date manipulation

**Testing:**
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** or **Cypress** - E2E testing

**Development Tools:**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

### 2.2 Frontend Architecture

**Folder Structure:**

```
frontend/
├── public/
│   └── locales/           # i18n translation files
│       ├── en/
│       │   ├── common.json
│       │   ├── patients.json
│       │   ├── visits.json
│       │   └── reports.json
│       └── es/
│           └── ...
├── src/
│   ├── api/               # API client layer
│   │   ├── client.ts      # Axios instance with interceptors
│   │   ├── patients.ts    # Patient API calls
│   │   ├── visits.ts      # Visit API calls
│   │   ├── staff.ts       # Staff API calls
│   │   ├── auth.ts        # Authentication API
│   │   └── types.ts       # API type definitions
│   ├── components/        # Reusable components
│   │   ├── common/        # Generic components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Table/
│   │   │   ├── Modal/
│   │   │   └── Layout/
│   │   ├── patients/      # Patient-specific components
│   │   │   ├── PatientForm/
│   │   │   ├── PatientCard/
│   │   │   ├── PatientList/
│   │   │   └── PatientSearch/
│   │   ├── visits/        # Visit-specific components
│   │   │   ├── VisitForm/
│   │   │   ├── VisitCard/
│   │   │   └── VisitList/
│   │   └── reports/       # Report components
│   ├── pages/             # Page components (routes)
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Patients/
│   │   │   ├── PatientList.tsx
│   │   │   ├── PatientDetail.tsx
│   │   │   └── PatientEdit.tsx
│   │   ├── Visits/
│   │   │   ├── VisitList.tsx
│   │   │   ├── VisitDetail.tsx
│   │   │   ├── VisitEdit.tsx
│   │   │   ├── VisitOpen.tsx
│   │   │   └── VisitClose.tsx
│   │   ├── Admin/
│   │   │   ├── UserManagement.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   └── Backup.tsx
│   │   └── Reports/
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useVisits.ts
│   │   └── usePermissions.ts
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ClinicContext.tsx
│   ├── types/             # TypeScript type definitions
│   │   ├── patient.ts
│   │   ├── visit.ts
│   │   ├── staff.ts
│   │   └── common.ts
│   ├── utils/             # Utility functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   ├── styles/            # Global styles
│   │   └── theme.ts
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env                   # Environment variables
```

### 2.3 Component Hierarchy

**Layout Components:**

```
App
├── AuthProvider (context)
├── LanguageProvider (context)
└── Router
    ├── PublicLayout
    │   └── Login
    └── PrivateLayout (requires auth)
        ├── Sidebar/Navigation
        ├── Header (user info, logout, language selector)
        └── MainContent
            ├── Dashboard
            ├── Patients
            ├── Visits
            ├── Admin
            └── Reports
```

**Key Page Components:**

1. **Dashboard** (`/`)
   - OpenVisitList
   - PatientSearchBar
   - QuickStats

2. **PatientList** (`/patients`)
   - PatientSearchBar
   - PatientTable
   - Pagination

3. **PatientDetail** (`/patients/:id`)
   - PatientInfoCard
   - PatientVisitHistory
   - EditButton

4. **PatientEdit** (`/patients/:id/edit` or `/patients/new`)
   - PatientForm
   - ValidationErrors
   - SaveButton

5. **VisitList** (`/visits`)
   - VisitFilters (status, date range)
   - VisitTable
   - Pagination

6. **VisitDetail** (`/visits/:id`)
   - VisitInfoCard
   - PatientSnapshot
   - EditButton

7. **VisitEdit** (`/visits/:id/edit`)
   - VisitForm
   - ICD10AutoComplete
   - SaveButton

### 2.4 State Management Strategy

**Server State (React Query):**
- Patient data
- Visit data
- Staff data
- ICD-10 codes
- Reports data

**Client State (Context API / Zustand):**
- Authentication (token, user info)
- Language preference
- Current clinic
- UI preferences (theme, sidebar collapsed, etc.)

**Form State (React Hook Form):**
- Patient forms
- Visit forms
- Search filters

### 2.5 Authentication Flow

```
1. User enters credentials on Login page
2. Frontend sends POST to /api/auth/login
3. Backend validates credentials, returns JWT token + user info
4. Frontend stores token in localStorage (or httpOnly cookie)
5. AuthContext updates with user info
6. Redirect to Dashboard
7. All subsequent API calls include token in Authorization header
8. Axios interceptor handles 401 responses (redirect to login)
```

### 2.6 API Integration Layer

**Example API client (`src/api/patients.ts`):**

```typescript
import { apiClient } from './client';
import { Patient, PatientCreateInput, PatientUpdateInput } from '../types/patient';

export const patientsApi = {
  // Get patient by ID
  getById: async (clinicPatientID: string): Promise<Patient> => {
    const response = await apiClient.get(`/patient?clinicPatientID=${clinicPatientID}`);
    return response.data.data;
  },

  // Search patients
  search: async (query: string): Promise<Patient[]> => {
    const response = await apiClient.get(`/patient?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  // Create patient
  create: async (data: PatientCreateInput): Promise<Patient> => {
    const response = await apiClient.post('/patient', data);
    return response.data.data;
  },

  // Update patient
  update: async (id: string, data: PatientUpdateInput): Promise<Patient> => {
    const response = await apiClient.patch(`/patient?clinicPatientID=${id}`, data);
    return response.data.data;
  },

  // Delete patient
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/patient?clinicPatientID=${id}`);
  },
};
```

**Example custom hook (`src/hooks/usePatients.ts`):**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../api/patients';
import { PatientCreateInput, PatientUpdateInput } from '../types/patient';

export const usePatients = () => {
  const queryClient = useQueryClient();

  const usePatient = (id: string) => {
    return useQuery({
      queryKey: ['patient', id],
      queryFn: () => patientsApi.getById(id),
      enabled: !!id,
    });
  };

  const usePatientSearch = (query: string) => {
    return useQuery({
      queryKey: ['patients', 'search', query],
      queryFn: () => patientsApi.search(query),
      enabled: query.length > 2,
    });
  };

  const useCreatePatient = () => {
    return useMutation({
      mutationFn: (data: PatientCreateInput) => patientsApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      },
    });
  };

  const useUpdatePatient = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: PatientUpdateInput }) =>
        patientsApi.update(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      },
    });
  };

  return {
    usePatient,
    usePatientSearch,
    useCreatePatient,
    useUpdatePatient,
  };
};
```

### 2.7 Internationalization Migration

**Convert CSV to JSON:**

Current: `UIText.csv` → Python script → PHP define statements

New: `UIText.csv` → Conversion script → JSON files

**JSON Structure (`public/locales/en/patients.json`):**

```json
{
  "search": {
    "placeholder": "Enter patient ID, name, or family ID",
    "button": "Search",
    "noResults": "No patients found"
  },
  "form": {
    "clinicPatientID": "Patient ID",
    "familyID": "Family ID",
    "firstName": "First Name",
    "lastName": "Last Name",
    "sex": "Sex",
    "birthDate": "Birth Date",
    "save": "Save Patient",
    "cancel": "Cancel"
  },
  "table": {
    "name": "Name",
    "id": "Patient ID",
    "age": "Age",
    "lastVisit": "Last Visit",
    "actions": "Actions"
  }
}
```

**Usage in React:**

```typescript
import { useTranslation } from 'react-i18next';

function PatientSearch() {
  const { t } = useTranslation('patients');

  return (
    <input
      placeholder={t('search.placeholder')}
      // ...
    />
  );
}
```

### 2.8 Migration Phases

**Phase 1: Setup & Infrastructure (Week 1-2)**
- Initialize React + TypeScript + Vite project
- Setup folder structure
- Configure ESLint, Prettier
- Setup React Router
- Create basic Layout components
- Convert UIText.csv to JSON localization files
- Setup i18next

**Phase 2: Core Components & API Layer (Week 3-4)**
- Create API client with Axios
- Implement authentication flow
- Build common components (Button, Input, Table, Modal)
- Create AuthContext and LanguageContext
- Setup React Query

**Phase 3: Patient Management (Week 5-6)**
- Patient search page
- Patient detail page
- Patient add/edit form
- Patient API integration
- Patient custom hooks

**Phase 4: Visit Management (Week 7-8)**
- Dashboard with open visits
- Visit open/close pages
- Visit edit page
- ICD-10 autocomplete component
- Visit API integration

**Phase 5: Admin & Reports (Week 9-10)**
- Admin pages (user management, logs)
- Report pages (convert PHP reports to React)
- Staff management

**Phase 6: Testing & Optimization (Week 11-12)**
- Unit tests for components
- Integration tests for pages
- E2E tests for critical flows
- Performance optimization
- Accessibility audit

**Phase 7: Deployment (Week 13)**
- Build optimization
- Deploy frontend (Nginx or similar)
- Update deployment scripts

---

## Part 3: Backend API Refactoring Plan

### 3.1 Backend Technology Decision

**Option A: Keep PHP Backend (Enhanced)**
- Pros: Less migration effort, team familiarity, existing codebase
- Cons: Limited modern tooling, harder to scale

**Option B: Migrate to Node.js + Express**
- Pros: Modern ecosystem, TypeScript support, npm packages, better performance
- Cons: Complete rewrite required, learning curve

**Option C: Migrate to Python + FastAPI**
- Pros: Excellent for data/ML, automatic OpenAPI docs, async support
- Cons: Team may need to learn Python

**Recommendation: Option B (Node.js + Express + TypeScript)**

Rationale:
- TypeScript enables shared types between frontend and backend
- Large ecosystem with excellent libraries
- Better async/await support for modern APIs
- Strong testing tools
- Can run on same hardware (Raspberry Pi supports Node.js)

### 3.2 Backend Technology Stack

**Core Framework:**
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety

**Database:**
- **mysql2** - MySQL client with promises
- **Knex.js** or **Prisma** - Query builder / ORM
  - Prisma recommended: Type-safe, auto-generated client, migrations

**Authentication:**
- **jsonwebtoken** - JWT token generation/validation
- **bcryptjs** - Password hashing
- **express-rate-limit** - Rate limiting for auth endpoints

**Validation:**
- **Zod** or **Joi** - Request validation

**Logging:**
- **Winston** or **Pino** - Structured logging

**Documentation:**
- **Swagger/OpenAPI** - API documentation
- **swagger-ui-express** - Interactive API docs

**Testing:**
- **Jest** - Unit testing
- **Supertest** - API endpoint testing

**Development:**
- **Nodemon** - Auto-restart on file changes
- **ESLint** - Code linting
- **Prettier** - Code formatting

### 3.3 Backend Architecture

**Folder Structure:**

```
backend/
├── src/
│   ├── config/            # Configuration
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── app.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # JWT validation
│   │   ├── errorHandler.ts
│   │   ├── validate.ts    # Request validation
│   │   └── logger.ts
│   ├── models/            # Database models (Prisma schema)
│   │   └── schema.prisma
│   ├── routes/            # API routes
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── patients.ts
│   │   ├── visits.ts
│   │   ├── staff.ts
│   │   ├── reports.ts
│   │   └── admin.ts
│   ├── controllers/       # Request handlers
│   │   ├── authController.ts
│   │   ├── patientController.ts
│   │   ├── visitController.ts
│   │   ├── staffController.ts
│   │   └── reportController.ts
│   ├── services/          # Business logic
│   │   ├── authService.ts
│   │   ├── patientService.ts
│   │   ├── visitService.ts
│   │   ├── staffService.ts
│   │   └── reportService.ts
│   ├── repositories/      # Data access layer
│   │   ├── patientRepository.ts
│   │   ├── visitRepository.ts
│   │   ├── staffRepository.ts
│   │   └── sessionRepository.ts
│   ├── types/             # TypeScript types
│   │   ├── patient.ts
│   │   ├── visit.ts
│   │   ├── staff.ts
│   │   ├── auth.ts
│   │   └── common.ts
│   ├── utils/             # Utility functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── response.ts
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Seed data
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
├── .env
└── .env.example
```

### 3.4 Layered Architecture

**Request Flow:**

```
Client Request
    ↓
Express Route (routing)
    ↓
Middleware (auth, validation, logging)
    ↓
Controller (request/response handling)
    ↓
Service (business logic)
    ↓
Repository (data access)
    ↓
Database
```

**Example Implementation:**

**Route (`src/routes/patients.ts`):**
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { patientController } from '../controllers/patientController';
import { patientSchemas } from '../types/patient';

const router = Router();

router.get(
  '/',
  authenticate,
  patientController.search
);

router.get(
  '/:id',
  authenticate,
  patientController.getById
);

router.post(
  '/',
  authenticate,
  validate(patientSchemas.create),
  patientController.create
);

router.patch(
  '/:id',
  authenticate,
  validate(patientSchemas.update),
  patientController.update
);

router.delete(
  '/:id',
  authenticate,
  patientController.delete
);

export default router;
```

**Controller (`src/controllers/patientController.ts`):**
```typescript
import { Request, Response, NextFunction } from 'express';
import { patientService } from '../services/patientService';
import { ApiResponse } from '../utils/response';

export const patientController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, clinicPatientID, familyID, lastName } = req.query;
      const patients = await patientService.search({
        query: q as string,
        clinicPatientID: clinicPatientID as string,
        familyID: familyID as string,
        lastName: lastName as string,
      });
      return ApiResponse.success(res, patients);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.getById(req.params.id);
      return ApiResponse.success(res, patient);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.create(req.body);
      return ApiResponse.created(res, patient);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.update(req.params.id, req.body);
      return ApiResponse.success(res, patient);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await patientService.delete(req.params.id);
      return ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  },
};
```

**Service (`src/services/patientService.ts`):**
```typescript
import { patientRepository } from '../repositories/patientRepository';
import { PatientCreateInput, PatientUpdateInput, Patient } from '../types/patient';
import { NotFoundError, ValidationError } from '../utils/errors';

export const patientService = {
  async search(params: {
    query?: string;
    clinicPatientID?: string;
    familyID?: string;
    lastName?: string;
  }): Promise<Patient[]> {
    // Business logic for search
    if (params.query) {
      return await patientRepository.searchByQuery(params.query);
    }
    return await patientRepository.findByFilters(params);
  },

  async getById(id: string): Promise<Patient> {
    const patient = await patientRepository.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  },

  async create(data: PatientCreateInput): Promise<Patient> {
    // Business logic validation
    await this.validatePatientID(data.clinicPatientID);
    return await patientRepository.create(data);
  },

  async update(id: string, data: PatientUpdateInput): Promise<Patient> {
    await this.getById(id); // Check if exists
    return await patientRepository.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await this.getById(id); // Check if exists
    await patientRepository.delete(id);
  },

  async validatePatientID(clinicPatientID: string): Promise<void> {
    const existing = await patientRepository.findById(clinicPatientID);
    if (existing) {
      throw new ValidationError('Patient ID already exists');
    }
  },
};
```

**Repository (`src/repositories/patientRepository.ts`):**
```typescript
import { PrismaClient } from '@prisma/client';
import { Patient, PatientCreateInput, PatientUpdateInput } from '../types/patient';

const prisma = new PrismaClient();

export const patientRepository = {
  async findById(clinicPatientID: string): Promise<Patient | null> {
    return await prisma.patient.findUnique({
      where: { clinicPatientID },
    });
  },

  async searchByQuery(query: string): Promise<Patient[]> {
    // Implement search logic (exact match first, then loose match)
    const exactMatch = await prisma.patient.findMany({
      where: {
        OR: [
          { clinicPatientID: query },
          { patientNationalID: query },
        ],
      },
      take: 100,
    });

    if (exactMatch.length > 0) {
      return exactMatch;
    }

    // Loose match
    return await prisma.patient.findMany({
      where: {
        OR: [
          { lastName: { contains: query } },
          { firstName: { contains: query } },
          { familyID: { contains: query } },
        ],
      },
      take: 100,
    });
  },

  async findByFilters(filters: any): Promise<Patient[]> {
    return await prisma.patient.findMany({
      where: filters,
      take: 100,
    });
  },

  async create(data: PatientCreateInput): Promise<Patient> {
    return await prisma.patient.create({
      data,
    });
  },

  async update(clinicPatientID: string, data: PatientUpdateInput): Promise<Patient> {
    return await prisma.patient.update({
      where: { clinicPatientID },
      data,
    });
  },

  async delete(clinicPatientID: string): Promise<void> {
    await prisma.patient.delete({
      where: { clinicPatientID },
    });
  },
};
```

### 3.5 Authentication & Authorization

**JWT Strategy:**

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';
import { sessionRepository } from '../repositories/sessionRepository';

export interface AuthRequest extends Request {
  user?: {
    username: string;
    accessLevel: string;
    clinicPublicID: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if session exists in database
    const session = await sessionRepository.findByToken(token);
    if (!session) {
      throw new UnauthorizedError('Invalid token');
    }

    // Update last activity
    await sessionRepository.updateLastActivity(token);

    // Attach user to request
    req.user = {
      username: decoded.username,
      accessLevel: decoded.accessLevel,
      clinicPublicID: decoded.clinicPublicID,
    };

    next();
  } catch (error) {
    next(new UnauthorizedError('Authentication failed'));
  }
}

export function requireAccess(minAccessLevel: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    const accessLevels = ['ClinicReadOnly', 'ClinicStaff', 'ClinicAdmin', 'SystemAdmin'];
    const userLevel = accessLevels.indexOf(req.user.accessLevel);
    const requiredLevel = accessLevels.indexOf(minAccessLevel);

    if (userLevel < requiredLevel) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}
```

**Login Flow:**

```typescript
// src/controllers/authController.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { staffRepository } from '../repositories/staffRepository';
import { sessionRepository } from '../repositories/sessionRepository';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await staffRepository.findByUsername(username);
      if (!user || !user.active) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate JWT
      const token = jwt.sign(
        {
          username: user.username,
          accessLevel: user.accessGranted,
          clinicPublicID: user.preferredClinicPublicID,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '8h' }
      );

      // Save session to database
      await sessionRepository.create({
        token,
        username: user.username,
        clinicPublicID: user.preferredClinicPublicID,
      });

      // Return token and user info
      return ApiResponse.success(res, {
        token,
        user: {
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          accessLevel: user.accessGranted,
          preferredLanguage: user.preferredLanguage,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await sessionRepository.deleteByToken(token);
      }
      return ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  },
};
```

### 3.6 Database Migration with Prisma

**Prisma Schema (`prisma/schema.prisma`):**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Staff {
  username                String   @id @db.VarChar(20)
  password                String   @db.VarChar(255)
  accessGranted           String   @db.VarChar(20)
  active                  Boolean  @default(true)
  firstName               String   @db.VarChar(50)
  lastName                String   @db.VarChar(50)
  position                String?  @db.VarChar(50)
  memberID                String?  @db.VarChar(50)
  preferredLanguage       String?  @db.VarChar(10)
  preferredClinicPublicID String?  @db.VarChar(50)
  createdDate             DateTime @default(now())
  modifiedDate            DateTime @updatedAt

  sessions Session[]

  @@map("staff")
}

model Session {
  token            String   @id @db.VarChar(255)
  username         String   @db.VarChar(20)
  clinicPublicID   String   @db.VarChar(50)
  createdDate      DateTime @default(now())
  lastActivityDate DateTime @updatedAt

  staff Staff @relation(fields: [username], references: [username], onDelete: Cascade)

  @@index([username])
  @@map("session")
}

model Patient {
  clinicPatientID      String    @id @db.VarChar(50)
  patientNationalID    String?   @db.VarChar(50)
  familyID             String?   @db.VarChar(50)
  lastName             String    @db.VarChar(50)
  firstName            String    @db.VarChar(50)
  sex                  String    @db.Char(1)
  birthDate            DateTime? @db.Date
  homeAddress          String?   @db.VarChar(255)
  homeNeighborhood     String?   @db.VarChar(100)
  homeCity             String?   @db.VarChar(100)
  homeCounty           String?   @db.VarChar(100)
  homeState            String?   @db.VarChar(100)
  contactPhone         String?   @db.VarChar(50)
  contactAltPhone      String?   @db.VarChar(50)
  knownAllergies       String?   @db.Text
  currentMedications   String?   @db.Text
  knownConditions      String?   @db.Text
  responsibleParty     String?   @db.VarChar(100)
  createdDate          DateTime  @default(now())
  modifiedDate         DateTime  @updatedAt

  visits Visit[]

  @@index([lastName, firstName])
  @@index([familyID])
  @@index([patientNationalID])
  @@map("patient")
}

model Visit {
  visitID              String    @id @default(uuid()) @db.VarChar(50)
  patientVisitID       String    @unique @db.VarChar(50)
  clinicPatientID      String    @db.VarChar(50)
  visitType            String?   @db.VarChar(50)
  visitStatus          String    @default("Open") @db.VarChar(20)
  staffUsername        String?   @db.VarChar(20)
  staffName            String?   @db.VarChar(100)
  staffPosition        String?   @db.VarChar(50)
  dateTimeIn           DateTime  @default(now())
  dateTimeOut          DateTime?
  primaryComplaint     String?   @db.Text
  secondaryComplaint   String?   @db.Text
  diagnosis1           String?   @db.VarChar(100)
  diagnosis2           String?   @db.VarChar(100)
  diagnosis3           String?   @db.VarChar(100)
  condition            String?   @db.Text
  treatment            String?   @db.Text
  weight               Decimal?  @db.Decimal(5, 2)
  height               Decimal?  @db.Decimal(5, 2)
  temp                 Decimal?  @db.Decimal(4, 1)
  bp                   String?   @db.VarChar(20)
  pulse                Int?
  respRate             Int?
  amountPaid           Decimal?  @db.Decimal(10, 2)
  paymentPlan          String?   @db.VarChar(50)
  paymentReason        String?   @db.VarChar(255)
  createdDate          DateTime  @default(now())
  modifiedDate         DateTime  @updatedAt

  patient Patient @relation(fields: [clinicPatientID], references: [clinicPatientID], onDelete: Cascade)

  @@index([clinicPatientID])
  @@index([visitStatus])
  @@index([dateTimeIn])
  @@map("visit")
}

model ICD10 {
  icd10index       Int    @id @default(autoincrement())
  diagnosisCode    String @unique @db.VarChar(10)
  shortDescription String @db.VarChar(100)
  longDescription  String @db.Text

  @@index([diagnosisCode])
  @@map("icd10")
}

// ... other models (Log, Comment, TextMsg, etc.)
```

### 3.7 Error Handling

**Custom Error Classes (`src/utils/errors.ts`):**

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}
```

**Error Handler Middleware (`src/middleware/errorHandler.ts`):**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn({
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Unexpected errors
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
```

### 3.8 API Documentation with Swagger

```typescript
// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'piClinc API',
      version: '2.0.0',
      description: 'Clinic management system API',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

### 3.9 Migration Phases

**Phase 1: Setup & Infrastructure (Week 1-2)**
- Initialize Node.js + TypeScript project
- Setup Prisma with existing database
- Configure Express app
- Setup middleware (auth, logging, error handling)
- Create base project structure

**Phase 2: Authentication & Core (Week 3-4)**
- Implement JWT authentication
- Migrate session management
- Create authentication endpoints
- Setup authorization middleware

**Phase 3: Patient API (Week 5-6)**
- Migrate patient GET, POST, PATCH, DELETE endpoints
- Implement patient search logic
- Add validation
- Write unit tests

**Phase 4: Visit API (Week 7-8)**
- Migrate visit endpoints
- Implement visit workflow logic
- Add visit status management
- Write unit tests

**Phase 5: Staff & Admin API (Week 9-10)**
- Migrate staff management endpoints
- Admin endpoints (users, logs, backup)
- ICD-10 endpoints

**Phase 6: Reports & Additional Features (Week 11-12)**
- Migrate report logic
- Text messaging service
- File upload/download

**Phase 7: Testing & Documentation (Week 13-14)**
- Integration tests
- API documentation with Swagger
- Performance testing
- Security audit

---

## Part 4: Database Considerations

### 4.1 Schema Changes

**Minimal Changes Needed:**
The existing schema is well-designed and can be largely preserved. Recommended changes:

1. **Add indexes** for common queries
2. **Normalize** some denormalized fields if needed
3. **Add soft delete** columns (`deletedAt`) instead of hard deletes
4. **Add audit columns** if not present (`createdBy`, `modifiedBy`)

### 4.2 Views Migration

**Current:** 21 database views for complex queries

**Options:**
1. **Keep views** - Prisma can work with views using raw queries
2. **Migrate to query logic** - Move view logic into repository layer
3. **Hybrid** - Keep critical views, migrate others

**Recommendation:** Start with keeping views, gradually migrate to query logic for better type safety

---

## Part 5: Deployment Strategy

### 5.1 Development Environment

```
Docker Compose setup:
- MySQL container
- Backend container (Node.js)
- Frontend dev server (Vite)
```

### 5.2 Production Deployment

**Option A: Monolithic (Raspberry Pi)**
```
Raspberry Pi:
├── MySQL database
├── Node.js backend (PM2)
└── Nginx
    ├── Serve React build (static files)
    └── Proxy /api to Node.js backend
```

**Option B: Separated (Cloud + Edge)**
```
Cloud Server:
├── MySQL database (RDS or similar)
└── Node.js backend (Load balanced)

Edge (Raspberry Pi / Local):
└── Nginx (serve React SPA)
```

### 5.3 Build & Deploy Process

**Frontend:**
```bash
npm run build  # Creates optimized production build
# Output: dist/ folder with static files
# Deploy to Nginx /var/www/html/
```

**Backend:**
```bash
npm run build  # TypeScript compilation
# Output: dist/ folder with .js files
# Run with PM2: pm2 start dist/server.js
```

---

## Part 6: Migration Timeline

### 6-Month Plan

**Month 1-2: Frontend Foundation**
- Week 1-2: Project setup, infrastructure
- Week 3-4: Core components, API layer
- Week 5-6: Patient management
- Week 7-8: Visit management

**Month 3: Frontend Completion**
- Week 9-10: Admin & reports
- Week 11-12: Testing & optimization

**Month 4-5: Backend Migration**
- Week 13-14: Backend setup & auth
- Week 15-16: Patient API
- Week 17-18: Visit API
- Week 19-20: Staff & admin API
- Week 21-22: Reports & features

**Month 6: Integration & Deployment**
- Week 23-24: Integration testing
- Week 25: Performance & security
- Week 26: Deployment & documentation

### 6.4 Risks & Mitigation

**Risks:**
1. **Data migration issues** - Mitigation: Extensive testing, rollback plan
2. **Performance on Raspberry Pi** - Mitigation: Performance testing, optimization
3. **Learning curve** - Mitigation: Training, documentation
4. **Feature parity** - Mitigation: Comprehensive feature checklist

---

## Part 7: Testing Strategy

### 7.1 Frontend Testing

**Unit Tests:**
- Component testing with React Testing Library
- Utility function tests
- Custom hook tests

**Integration Tests:**
- Page-level tests
- User flow tests

**E2E Tests:**
- Critical paths (login, patient creation, visit workflow)

### 7.2 Backend Testing

**Unit Tests:**
- Service layer tests
- Repository tests
- Utility tests

**Integration Tests:**
- API endpoint tests with Supertest
- Database integration tests

**Load Tests:**
- Performance testing with Apache Bench or k6
- Ensure Raspberry Pi can handle expected load

---

## Part 8: Next Steps

1. **Review and approve this plan**
2. **Setup development environment**
3. **Create detailed task breakdown** (GitHub issues/Jira)
4. **Assign team members** to frontend/backend tracks
5. **Setup CI/CD pipeline**
6. **Begin Phase 1 implementation**

---

## Appendix A: Technology Comparison

| Aspect | Current (PHP) | Target (React + Node.js) |
|--------|--------------|--------------------------|
| **Frontend** | Server-side rendering | Client-side SPA |
| **State Management** | Page reloads | React state + caching |
| **Type Safety** | None | TypeScript |
| **Testing** | Postman only | Unit + Integration + E2E |
| **Build Process** | None | Vite build |
| **Code Reusability** | Limited | High (components) |
| **Performance** | Server load per page | Initial load + fast navigation |
| **Offline Support** | None | Possible (PWA) |
| **Mobile** | Responsive CSS | Responsive + mobile-optimized |

## Appendix B: File Count Comparison

**Current:**
- 149 PHP files
- 21 database views
- 12 database tables
- ~500 UI text strings

**Target (estimated):**
- Frontend: ~150 TypeScript files
- Backend: ~80 TypeScript files
- Database: Same (12 tables, Prisma schema)
- Localization: ~50 JSON files

## Appendix C: Key Dependencies

**Frontend:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.14.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.49.0",
    "yup": "^1.3.3",
    "react-i18next": "^13.5.0",
    "@mui/material": "^5.15.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.2"
  }
}
```

**Backend:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "prisma": "^5.7.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

---

**Document Version:** 1.0
**Created:** 2026-03-15
**Author:** Claude Code
**Status:** Draft for Review
