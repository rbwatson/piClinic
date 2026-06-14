# piClinic v2.0 Refactor - Development Guide

This file provides guidance for working on the piClinic v2.0 refactor project.

## Overall development principles

**Think before coding.** State your assumptions out loud. If the request is ambiguous, ask. If a simpler approach exists, push back. Stop when you are confused, name what is unclear, do not just pick one interpretation and run.

**Simplicity first.** Write the minimum code that solves the problem. No speculative abstractions. No flexibility nobody asked for. The test: would a senior engineer call this overcomplicated.

**Surgical changes.** Touch only what the task requires. Do not improve neighboring code. Do not refactor what is not broken. Every changed line should trace back to the request.

**Goal-driven execution.** Turn vague instructions into verifiable targets before writing a line. “Add validation” becomes “write tests for invalid inputs, then make them pass.”

## Project Overview

piClinic is a clinic information system designed for resource-constrained environments. The v2.0 refactor transforms a PHP monolith with server-side rendering into a modern React SPA with an enhanced PHP backend.

**Current State:**
- Version: v1.x (production), v2.0 (in development)
- Status: Active refactoring — Phase 3 frontend in progress

**Key Documentation:**
- Master plan: `v2_refactor/REFACTORING_GUIDE.md`
- Implementation details: `v2_refactor/IMPLEMENTATION_PRIORITIES.md`

## Branch Strategy

| Branch | Purpose |
|--------|----------|
| `main` | v1.x production code. Not modified while v1 systems are running. |
| `main_v2` | Stable v2.0 code. Receives merges from phase branches at phase-end Go/No-Go decisions only. |
| `phase-3-frontend-core` | Current working branch. |

Phase branches fork from the previous phase branch, contain all work for that phase,
and merge into `main_v2` only at the phase-end Go/No-Go decision point.

### Current Branch

```bash
git branch --show-current
```

## Critical Constraints

1. **Must run on Raspberry Pi 3B+ (1GB RAM)**
   - Backend memory usage must stay under 700MB
   - Frontend bundle optimised for low-resource browsers
   - Test on Pi at Phase 2 and Phase 5 checkpoints

2. **Zero data loss during migration**
   - Never drop columns or tables
   - All migrations must have rollback scripts

3. **Minimal downtime (< 45 minutes for migration)**

4. **Backward compatibility during transition**
   - v1.x must continue working until migration
   - API versioning (/api/v2/)

5. **Platform support**
   - P0: Raspberry Pi 3B+, Ubuntu 20.04+
   - P1: Windows 10+

## Technology Stack

### Frontend (v2.0)
- React 19 with TypeScript
- Build tool: Vite 8
- State management: React Query (server state) + Context (UI state)
- Routing: React Router v7
- Forms: React Hook Form
- i18n: react-i18next (EN/ES, persisted to localStorage)
- HTTP: Axios (in-memory session token, no localStorage)
- Styling: **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Component pattern: shadcn-compatible CSS variable tokens, no external component library
- Testing: Vitest + React Testing Library + Playwright

### Backend (v2.0)
- PHP 8.4
- Apache web server with `AllowOverride All`
- MariaDB 10.11 LTS
- Architecture: Controller → Service → Repository pattern
- Testing: PHPUnit 13 + PHPStan (level 8)
- Documentation: OpenAPI (swagger-php)

### Correct Directory Paths
- v2 API source: `www_v2/html/api/src/` (Controllers, Services, Repositories, Models)
- v2 API deployed: `/var/www/html/api/`
- v2 frontend source: `frontend/`
- v2 frontend deployed: `/var/www/html/`
- OpenAPI spec: `www_v2/html/api/docs/openapi.yaml`

## API Response Conventions

- `POST`/create: `{ status: 'success', data: T }` (201)
- `GET` list: bare array `T[]` (no envelope)
- `GET` single: bare object `T` (no envelope)
- `PATCH`/update: bare object `T` (no envelope)
- Auth header: `X-Session-Token: <token>`
- Session model fields: `token, username, accessGranted, sessionLanguage, sessionClinicPublicID, expiresOnDate`
- Session does NOT include `firstName` or `lastName`

## Frontend Build and Deploy

The Pi never runs a build step. Build on the dev machine and deploy the output.
For PHP-only changes, use `--skip-build` to avoid a full frontend rebuild:

```bash
# Full deploy (PHP + frontend)
bash tools/deploy.sh v2

# PHP-only change (skip frontend rebuild)
bash tools/deploy.sh v2 --skip-build
```

`www_v2/html/.htaccess` rewrites all non-file, non-API requests to `index.html`
for React Router client-side routing on port 80.

## Architecture Patterns

### Backend Structure
```
www_v2/html/api/src/
├── Controllers/    # HTTP layer, request/response
├── Services/       # Business logic
├── Repositories/   # Data access
├── Models/         # Data models (readonly, toArray(), fromRow())
├── Middleware/     # Auth, CORS
└── Config/         # Configuration
```

### Frontend Structure
```
frontend/src/
├── api/            # API functions + React Query hooks (visits.ts, patients.ts)
├── components/     # Reusable components (AppShell, ProtectedRoute)
├── context/        # React contexts (AuthContext)
├── lib/            # Shared utilities (api.ts, i18n.ts, queryClient.ts, *.utils.ts)
├── locales/        # i18n JSON files (en.json, es.json)
├── pages/          # Page components (one per route)
├── test/           # Test setup (setup.ts)
└── App.tsx         # Root router
```

## PHP Backend Notes

### mysqli bind_param type strings

When writing `bind_param()` calls with long type strings, **always verify the
character count programmatically** before committing. Manual counting is
unreliable for strings longer than ~10 characters and will cause a runtime
`Fatal error: The number of elements in the type definition string must match
the number of bind variables`.

Use Python to verify:
```python
variables = ['s', 'i', 's', 's', ...]  # one entry per bound variable
correct = ''.join(variables)
print(f'String: "{correct}"  Length: {len(correct)}')
```

The type string length must equal the number of `?` placeholders in the SQL
statement. `NOW()` and other SQL expressions do not use `?` and do not appear
in the type string.

## Testing Philosophy

### Write tests alongside the code — not after

Every group of pages in Phase 3 ships with tests in the same commit. Tests are
not a cleanup task; they are part of the definition of done for each group.

### Three layers — use all three

**Layer 1: Unit tests (Vitest)** — pure functions and isolated logic.
Fast, no browser, no backend. These are the first tests to write because
they catch the most regressions for the least effort.

Target: every pure utility function (`pipeToLines`, `linesToPipe`,
`patientDisplayName`, `hasRole`, date formatters, etc.) has unit test coverage
before the component that uses it is considered complete.

**Layer 2: Component tests (Vitest + React Testing Library)** — component
behaviour in a simulated browser (jsdom). API calls are mocked via MSW or
`vi.mock`. These verify: form renders correctly, validation fires on bad input,
error banners appear, buttons are disabled during loading, role-based UI
hides/shows correctly.

Target: every page component has tests for its primary render state, its
error state, and any non-trivial user interaction.

**Layer 3: E2E tests (Playwright)** — full browser, real backend, real
database. These verify complete user workflows end to end. They are slower
and require the backend to be running, so they are written after the unit
and component tests are in place.

Target: one E2E test per major workflow (login, create patient, open visit,
close visit). These are regression guards for the full stack.

### E2E test conventions

**Navigation:** Always navigate by clicking UI elements — never use
`page.goto()` to jump directly to a protected page. The session token lives
in `sessionStorage` and survives link-click navigation within the same tab,
but `page.goto()` can race with session restore.

**Targeting dashboard rows:** When the dashboard may show multiple rows
(including from previous test runs), scope the locator to the specific visit's
href rather than filtering by patient name:

```ts
await page.locator('tr')
  .filter({ has: page.locator(`a[href="/visits/${patientVisitID}"]`) })
  .getByRole('link', { name: 'View' })
  .click()
```

**Element targeting:** Use `data-testid` attributes on value-bearing elements
for assertions. Do not rely on translated text strings in locators — they will
break if translations change. Form inputs already have `id` attributes
(e.g. `#pulse`, `#primaryComplaint`) which are stable selectors.

**Text assertions:** When asserting on rendered text, use the English values
from `frontend/src/locales/en.json`, not i18n key names. The deployed app
renders real translated text. Key values to remember:
- `VISIT_STATUS_OPEN` → `"Admitted"`
- `VISIT_STATUS_CLOSED` → `"Discharged"`

**Strict mode:** Playwright throws if a locator matches more than one element.
Chain multiple `.filter()` calls to narrow to exactly one match:

```ts
// Narrow to the Status field specifically (not 'Admitted to clinic')
page.locator('div.label-value')
  .filter({ hasText: 'Status' })
  .filter({ hasText: 'Admitted' })
```

**Stale test data:** If a test run is aborted before `afterEach` runs,
`PT-E2E-` prefixed patients and visits are left in the database and cause
strict-mode violations on the next run. Clean up manually:

```sql
DELETE FROM visit   WHERE clinicPatientID LIKE 'PT-E2E-%';
DELETE FROM patient WHERE clinicPatientID LIKE 'PT-E2E-%';
```

**DB queries in tests:** Always use parameterized queries — never string
concatenation:

```ts
// Correct
const rows = await query<VisitRow>(
  'SELECT primaryComplaint FROM visit WHERE patientVisitID = ?',
  [patientVisitID]
)

// Wrong — do not do this
const rows = await query<VisitRow>(
  'SELECT primaryComplaint FROM visit WHERE patientVisitID = ' + patientVisitID
)
```

### Extract pure functions for testability

Business logic that lives inside a component cannot be unit-tested without
rendering the component. When a component contains non-trivial logic (data
transformation, validation, role checks), extract it into a `*.utils.ts`
file in `src/lib/` or alongside the module. This makes the logic independently
testable and documents the intended behaviour.

Example: `src/lib/patientForm.utils.ts` contains `pipeToLines`, `linesToPipe`,
`patientDisplayName`, and `hasRole` — all extracted from their originating
components and tested in `patientForm.utils.test.ts`.

### Test file naming and location

- Unit/component tests: co-located with the source file, `.test.ts` or `.test.tsx` suffix
- Pure utility tests: `src/lib/featureName.utils.test.ts`
- API module tests: `src/api/moduleName.utils.test.ts`
- E2E tests: `frontend/e2e/specs/workflowName.spec.ts` (Playwright)
- E2E helpers: `frontend/e2e/helpers/` (auth.ts, api.ts, db.ts, env.ts)
- E2E fixtures: `frontend/e2e/fixtures/testData.ts`
- Test setup: `src/test/setup.ts`

### Mock strategy

- `react-i18next` is mocked globally in `src/test/setup.ts` — the `t()` function
  returns the key as the value, making assertions like `getByText('LOGIN_SUBMIT')`
  readable and stable across language changes
- `react-router-dom` is NOT globally mocked — wrap components in `<MemoryRouter>`
  in tests that need routing
- `AuthContext` is mocked per-test using `vi.spyOn(AuthContext, 'useAuth')`
- API calls are mocked at the Axios level using `vi.mock('@/lib/api')` or MSW
  for more complex scenarios

### Running tests

```bash
cd ~/piClinic/frontend
npm test                              # run all unit/component tests once
npx playwright test                   # E2E tests (run from frontend/)
npx playwright test --headed          # E2E with visible browser
npx playwright test e2e/specs/visitDetail.spec.ts  # single spec file
```

### E2E environment setup

E2E tests require `frontend/e2e/.env.e2e` (gitignored). Create from the example:

```bash
cp frontend/e2e/.env.e2e.example frontend/e2e/.env.e2e
# Edit with real DB credentials and test user password
```

The E2E test user and DB account are created by `sql/CreateE2ETestUser.sql`.
All E2E test records use the `PT-E2E-` prefix for easy identification.

### Coverage targets

- Unit + component tests: 80%+ of `src/lib/` and `src/pages/`
- E2E: all P0 user workflows (login, patient CRUD, visit open/close)

## Coding Standards

### General
- No `console.log` or `var_dump` in production code
- Use meaningful variable/function names
- No `any` in TypeScript unless unavoidable

### PHP Backend
- PSR-12 coding standard
- Type hints on all parameters and return types
- Prepared statements for all SQL
- OpenAPI annotations on all endpoints
- Controllers are thin — business logic in Services, data access in Repositories

### React Frontend
- Functional components with hooks only
- React Query for all server state
- Context only for global UI state (auth, language)
- Pure functions extracted to `*.utils.ts` files for testability
- Tailwind utility classes directly in JSX — no inline `style` props
- Do NOT use `@apply` inside `@layer base` with CSS-variable-backed utilities
  (Tailwind v4 limitation) — use direct CSS properties instead

## git Sync Pattern

When Claude commits to the repo and you have local changes (npm install,
composer update, deploy.sh), use:

```bash
git stash
git pull
git stash pop
npm install    # regenerate package-lock.json if package.json changed
```

Commit updated lock files from the VM after any install or update.

## Tailwind v4 Notes

- Use `@tailwindcss/vite` plugin (not postcss)
- Token pattern: CSS variables in `src/globals.css`, referenced in `tailwind.config.ts`
  as `hsl(var(--token))`
- Do NOT use `@apply` inside `@layer base` for CSS-variable-backed utilities

## Quick Commands Reference

### Backend
```bash
cd ~/piClinic/www_v2/html/api
composer test                         # PHPUnit
composer analyse                      # PHPStan level 8
```

### Frontend
```bash
cd ~/piClinic/frontend
npm run dev                           # dev server (port 5173, proxies /api to :80)
npm run build                         # production build to dist/
npm test                              # Vitest unit/component tests
npx playwright test                   # Playwright E2E tests
npx playwright test --headed          # E2E with visible browser

# Generate TypeScript types from OpenAPI spec
npx openapi-typescript \
  ~/piClinic/www_v2/html/api/docs/openapi.yaml \
  --output src/api/types.ts
```

### Deploy
```bash
# Full deploy (rebuilds frontend)
bash tools/deploy.sh v2

# PHP-only change
bash tools/deploy.sh v2 --skip-build
```

## Performance Targets

### Raspberry Pi 3B+
- Total memory: < 700MB
- API response: < 500ms (simple queries)
- Dashboard load: < 3s

### Ubuntu VM
- API response: < 200ms
- Dashboard load: < 2s

## Before Starting Any Task

1. Check your branch: `git branch --show-current`
2. Check existing code for patterns to follow
3. Consider Pi memory and bundle size constraints
4. Plan tests before writing the implementation
5. If the task is ambiguous, ask one clarifying question before writing code

---

**Document Version:** 2.1
**Created:** 2026-03-22
**Last Updated:** 2026-04-18
