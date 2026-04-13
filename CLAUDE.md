# piClinic v2.0 Refactor - Development Guide

This file provides guidance for working on the piClinic v2.0 refactor project.

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
|--------|---------|
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

The Pi never runs a build step. Build on the dev machine and deploy the output:

```bash
cd ~/piClinic/frontend
npm run build                   # compiles to frontend/dist/
cp -r dist/* ../www_v2/html/   # copy to deployment tree
cd ~/piClinic
bash tools/deploy.sh v2        # copy to /var/www/ and restart Apache
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
- E2E tests: `src/test/e2e/workflowName.spec.ts` (Playwright)
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
npm test                  # run all unit/component tests once
npm run test:watch        # watch mode during development
npm run test:coverage     # coverage report
npm run test:e2e          # Playwright E2E tests (requires backend running)
```

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
npm run test:watch                    # watch mode
npm run test:coverage                 # coverage report
npm run test:e2e                      # Playwright E2E

# Generate TypeScript types from OpenAPI spec
npx openapi-typescript \
  ~/piClinic/www_v2/html/api/docs/openapi.yaml \
  --output src/api/types.ts
```

### Deploy
```bash
cd ~/piClinic/frontend && npm run build
cp -r dist/* ../www_v2/html/
cd ~/piClinic && bash tools/deploy.sh v2
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

**Document Version:** 2.0
**Created:** 2026-03-22
**Last Updated:** 2026-04-13
