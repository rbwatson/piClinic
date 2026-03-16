# piClinc Refactoring Plan - Raspberry Pi 3B+ Addendum

## CRITICAL: Deployment Constraints

### Hardware Requirements

**Minimum Target Hardware: Raspberry Pi 3B+**
- **CPU:** 1.4GHz 64-bit quad-core ARM Cortex-A53
- **RAM:** 1GB LPDDR2 SDRAM
- **Architecture:** ARMv8-A (64-bit)
- **OS:** Raspberry Pi OS (Debian-based)

**Also Support:**
- Ubuntu LTS (various hardware configs)

### Impact on Technology Choices

The Raspberry Pi 3B+ constraint has **major implications** for the backend technology choice. The original plan recommended Node.js, but this needs reconsideration.

---

## Revised Backend Technology Recommendation

### Resource Comparison: PHP vs Node.js on Raspberry Pi 3B+

| Aspect | PHP 8 + Apache | Node.js + Express |
|--------|---------------|-------------------|
| **Memory Footprint** | ~50-100MB (Apache + PHP-FPM) | ~100-200MB (Node.js single instance) |
| **Proven on Pi 3B+** | ✅ Yes (current system works) | ⚠️ Unknown (needs testing) |
| **Startup Time** | Fast | Fast |
| **Build Required** | ❌ No | ✅ Yes (TypeScript compilation) |
| **ARM Support** | ✅ Excellent | ✅ Good |
| **Concurrent Requests** | Moderate (Apache MPM) | Good (event loop) |
| **Learning Curve** | Existing codebase | New stack |
| **Risk Level** | 🟢 Low | 🟡 Medium-High |

### RECOMMENDATION: Enhanced PHP Backend

**Given the constraints, I recommend KEEPING the PHP backend** with the following enhancements:

#### Reasons:

1. **Proven Performance:** Current system already runs successfully on Pi 3B+
2. **Lower Memory Footprint:** PHP+Apache uses significantly less RAM than Node.js
3. **Lower Risk:** No need to rewrite working API code
4. **Faster Implementation:** API is partially complete (49 files)
5. **No Build Process Needed:** PHP runs directly, no compilation required
6. **Team Familiarity:** Existing knowledge of the codebase

#### Enhancements Needed:

1. **Standardize API Structure:**
   - Keep existing pattern (resource.php, resource_get.php, etc.)
   - Add OpenAPI/Swagger documentation
   - Standardize response formats

2. **Improve Authentication:**
   - Migrate from session table tokens to JWT (stateless)
   - Or keep current session-based auth (works well for single-server deployment)

3. **Add Type Safety:**
   - Use PHPStan or Psalm for static analysis
   - Generate TypeScript types for frontend from PHP (using swagger-php)

4. **Improve Testing:**
   - Add PHPUnit tests for all API endpoints
   - Automated testing with GitHub Actions

5. **Better Error Handling:**
   - Standardize error responses
   - Better logging (Monolog)

6. **API Documentation:**
   - Add swagger-php annotations
   - Generate OpenAPI spec
   - Auto-generate TypeScript types for React frontend

---

## Revised Architecture

### Backend: Enhanced PHP API

**Technology Stack:**
- **PHP 8.x** (current)
- **Apache** with mod_rewrite (current)
- **MySQL/MariaDB** (current)
- **Composer** for dependency management

**New Libraries to Add:**
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

**Enhanced Folder Structure:**

```
www/html/api/
├── v2/                      # New API version (keep v1 for compatibility)
│   ├── index.php           # API entry point with routing
│   ├── config/             # Configuration
│   │   ├── database.php
│   │   ├── jwt.php
│   │   └── app.php
│   ├── middleware/         # Middleware
│   │   ├── Auth.php       # JWT validation
│   │   ├── CORS.php       # CORS headers
│   │   ├── Logger.php     # Request logging
│   │   └── Validator.php  # Request validation
│   ├── controllers/        # Controllers (business logic)
│   │   ├── AuthController.php
│   │   ├── PatientController.php
│   │   ├── VisitController.php
│   │   ├── StaffController.php
│   │   └── ReportController.php
│   ├── services/           # Business logic layer
│   │   ├── PatientService.php
│   │   ├── VisitService.php
│   │   └── AuthService.php
│   ├── repositories/       # Data access layer
│   │   ├── PatientRepository.php
│   │   ├── VisitRepository.php
│   │   └── StaffRepository.php
│   ├── models/             # Data models
│   │   ├── Patient.php
│   │   ├── Visit.php
│   │   └── Staff.php
│   ├── validators/         # Request validators
│   │   ├── PatientValidator.php
│   │   └── VisitValidator.php
│   └── docs/               # OpenAPI docs
│       └── openapi.yaml    # Generated from annotations
├── (existing API files)    # Keep for backward compatibility
```

### TypeScript Type Generation from PHP

**Using swagger-php annotations in PHP:**

```php
<?php
// In PatientController.php

/**
 * @OA\Schema(
 *     schema="Patient",
 *     required={"clinicPatientID", "lastName", "firstName", "sex"},
 *     @OA\Property(property="clinicPatientID", type="string", maxLength=50),
 *     @OA\Property(property="familyID", type="string", maxLength=50),
 *     @OA\Property(property="lastName", type="string", maxLength=50),
 *     @OA\Property(property="firstName", type="string", maxLength=50),
 *     @OA\Property(property="sex", type="string", enum={"M", "F", "X"}),
 *     @OA\Property(property="birthDate", type="string", format="date"),
 *     @OA\Property(property="homeAddress", type="string", maxLength=255),
 *     @OA\Property(property="knownAllergies", type="string"),
 * )
 */
class Patient {
    // ... model definition
}

/**
 * @OA\Get(
 *     path="/api/v2/patients/{id}",
 *     summary="Get patient by ID",
 *     tags={"Patients"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="string")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Patient found",
 *         @OA\JsonContent(ref="#/components/schemas/Patient")
 *     ),
 *     @OA\Response(response=404, description="Patient not found"),
 *     security={{"bearerAuth": {}}}
 * )
 */
public function getPatient($id) {
    // ... implementation
}
```

**Generate OpenAPI spec:**
```bash
vendor/bin/openapi www/html/api/v2 -o www/html/api/v2/docs/openapi.yaml
```

**Generate TypeScript types for React:**
```bash
npx openapi-typescript www/html/api/v2/docs/openapi.yaml --output frontend/src/api/types.ts
```

This gives you type safety in React:

```typescript
// frontend/src/api/types.ts (auto-generated)
export interface Patient {
  clinicPatientID: string;
  familyID?: string;
  lastName: string;
  firstName: string;
  sex: "M" | "F" | "X";
  birthDate?: string;
  homeAddress?: string;
  knownAllergies?: string;
}

// frontend/src/api/patients.ts
import { Patient } from './types';

export const getPatient = async (id: string): Promise<Patient> => {
  const response = await apiClient.get(`/api/v2/patients/${id}`);
  return response.data;
};
```

---

## Alternative: Node.js Backend (If Chosen)

If you decide to proceed with Node.js despite the risks, here are **critical optimizations** for Raspberry Pi 3B+:

### 1. Use Lightweight Alternatives

**Fastify instead of Express:**
- 2-3x faster
- Lower memory footprint
- Built-in schema validation

```typescript
// Much lighter than Express
import Fastify from 'fastify';
const fastify = Fastify({
  logger: true,
  maxParamLength: 200
});
```

### 2. Limit Node.js Memory

```bash
# Start Node.js with memory limit (512MB max)
node --max-old-space-size=512 dist/server.js
```

### 3. Use PM2 with Single Instance

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'piclinic-api',
    script: './dist/server.js',
    instances: 1,  // Only 1 instance on Pi 3B+
    max_memory_restart: '400M',  // Restart if exceeds 400MB
    node_args: '--max-old-space-size=512'
  }]
};
```

### 4. Avoid Heavy ORMs

**Don't use Prisma or TypeORM on Pi 3B+** - they're too heavy.

Use lightweight mysql2 directly:

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'CTS-user',
  password: process.env.DB_PASS,
  database: 'piclinic',
  waitForConnections: true,
  connectionLimit: 5,  // Low connection pool for Pi
  queueLimit: 0
});

// Raw queries with type safety
interface Patient {
  clinicPatientID: string;
  lastName: string;
  // ...
}

async function getPatient(id: string): Promise<Patient | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM patient WHERE clinicPatientID = ?',
    [id]
  );
  return rows[0] as Patient || null;
}
```

### 5. Mandatory Testing on Actual Hardware

**Before committing to Node.js, you MUST:**

1. **Set up test environment on actual Pi 3B+**
2. **Run load tests** with realistic traffic:
   ```bash
   # Test with Apache Bench
   ab -n 1000 -c 10 http://pi-address/api/v2/patients?q=test

   # Monitor memory
   watch -n 1 'free -m && ps aux | grep node'
   ```
3. **Profile memory usage** during peak load
4. **Test with MySQL running** on same Pi
5. **Ensure response times** are acceptable (<500ms for simple queries)

---

## Build and Deployment Strategy for Pi 3B+

### Frontend (React)

**Build on Development Machine:**
```bash
# On dev machine (NOT on Pi)
cd frontend
npm run build  # Creates optimized production build
```

**Deploy to Pi:**
```bash
# Copy build artifacts to Pi
rsync -avz frontend/dist/ pi@raspberrypi:/var/www/html/
```

**Nginx serves static files** (no Node.js needed for frontend)

### Backend (if PHP - RECOMMENDED)

**No build required!**
```bash
# Just copy PHP files
rsync -avz www/html/api/ pi@raspberrypi:/var/www/html/api/
```

### Backend (if Node.js - requires building)

**Build on Development Machine:**
```bash
# On dev machine (NOT on Pi)
cd backend
npm run build  # TypeScript → JavaScript compilation
```

**Deploy to Pi:**
```bash
# Copy built JS files and dependencies
rsync -avz backend/dist/ pi@raspberrypi:/opt/piclinic/api/
rsync -avz backend/package*.json pi@raspberrypi:/opt/piclinic/api/

# On Pi (only install production deps)
ssh pi@raspberrypi
cd /opt/piclinic/api
npm ci --production  # Faster than npm install
pm2 start ecosystem.config.js
```

**CRITICAL:** Never run `npm install` or TypeScript compilation on the Pi 3B+ itself - it will be extremely slow and may crash due to memory limits.

---

## Performance Benchmarks Required

Before finalizing the backend choice, run these tests on **actual Pi 3B+ hardware:**

### Test Scenarios:

1. **Idle State:**
   - PHP: Apache + PHP-FPM memory usage
   - Node.js: Node process memory usage
   - MySQL: Database memory usage
   - **Total should be < 800MB** (leave 200MB for OS)

2. **Load Test:**
   - 10 concurrent users
   - 100 requests/minute
   - Mix of patient search, visit queries, report generation
   - **Monitor:** Response times, memory usage, CPU usage

3. **Stress Test:**
   - Maximum realistic load (20 concurrent users)
   - Sustained for 5 minutes
   - **Ensure:** No crashes, acceptable response times

### Acceptance Criteria:

- ✅ System uses < 900MB RAM under normal load
- ✅ API response time < 500ms for simple queries
- ✅ No memory leaks over 24-hour period
- ✅ System recovers from stress test without restart

---

## Revised Migration Timeline

### Updated Plan (PHP Backend):

**Month 1-2: Frontend (Same as original)**
- React setup, components, pages
- No change from original plan

**Month 3: Frontend Completion + PHP API Enhancement (NEW)**
- Week 9-10: Complete React frontend
- **Week 11-12: Enhance PHP API** (instead of building Node.js)
  - Add swagger-php annotations
  - Improve API structure
  - Add validation layer
  - Generate OpenAPI spec
  - Generate TypeScript types

**Month 4: Integration & Testing**
- Week 13-14: Integrate React with enhanced PHP API
- Week 15-16: Testing on Pi 3B+, optimization

**Month 5-6: Reports, Admin, Deployment**
- Week 17-20: Remaining features
- Week 21-24: Testing, deployment, documentation

**Total: 5-6 months** (1 month faster than Node.js migration)

### Alternative Timeline (Node.js Backend):

Add **2-3 weeks** for:
- Testing Node.js on actual Pi 3B+ hardware
- Optimization if memory issues found
- Potential pivot back to PHP if Node.js doesn't work

---

## Risk Assessment

### PHP Backend (RECOMMENDED)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance issues | Low | Low | Already proven on Pi 3B+ |
| No shared types | Medium | Medium | Use OpenAPI to generate TS types |
| Less modern stack | Low | Low | PHP 8 is modern, has good features |
| Team prefers Node.js | Medium | Low | Can revisit in future when deploying to more powerful hardware |

**Overall Risk: LOW** 🟢

### Node.js Backend

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Insufficient RAM | **High** | **High** | Test on hardware first, optimize aggressively |
| Slower performance | Medium | Medium | Use Fastify, avoid heavy libraries |
| Complex deployment | Medium | Medium | Build elsewhere, deploy compiled JS |
| Complete API rewrite | Low | High | Careful planning, incremental migration |

**Overall Risk: MEDIUM-HIGH** 🟡

---

## Final Recommendations

### Recommended Approach: **React Frontend + Enhanced PHP Backend**

**Frontend:**
- ✅ React + TypeScript + Vite (as planned)
- ✅ Modern component library (Material-UI or Ant Design)
- ✅ All frontend improvements as originally planned

**Backend:**
- ✅ Keep PHP 8 (proven on Pi 3B+)
- ✅ Enhance existing API structure
- ✅ Add OpenAPI documentation with swagger-php
- ✅ Generate TypeScript types from OpenAPI spec
- ✅ Add proper validation, error handling, logging
- ✅ Add PHPUnit tests

**Benefits:**
1. Lower risk - builds on proven technology
2. Faster implementation - API already 80% complete
3. Lower resource usage - fits comfortably on Pi 3B+
4. Type safety - via OpenAPI → TypeScript generation
5. Future-proof - can migrate to Node.js later if deploying to more powerful hardware

**Migration Path:**
If you outgrow PHP in the future (e.g., deploying to cloud with more resources), you can:
1. Keep the React frontend (no changes needed)
2. Migrate backend to Node.js or other technology
3. OpenAPI spec provides contract between frontend/backend
4. TypeScript types remain compatible

---

## Next Steps

1. **Decision Point:** Choose backend technology
   - ✅ **Recommended:** Enhanced PHP backend
   - ⚠️ **Alternative:** Node.js (requires hardware testing first)

2. **If PHP chosen:**
   - Add Composer dependencies
   - Set up swagger-php
   - Create enhanced API structure
   - Generate OpenAPI spec
   - Begin React frontend implementation

3. **If Node.js chosen:**
   - **First:** Set up Node.js on test Pi 3B+
   - **Run:** Performance and memory benchmarks
   - **Verify:** System works within resource constraints
   - **Then:** Proceed with backend implementation

4. **Either way:**
   - Begin React frontend (independent of backend choice)
   - Frontend communicates via REST API (PHP or Node.js)

---

## Appendix: PHP 8 Modern Features

PHP 8 is more modern than many people realize. Here are features that make it competitive:

**Type Safety:**
```php
<?php
// Strict types
declare(strict_types=1);

// Union types, return types
function getPatient(string $id): Patient|null {
    // ...
}

// Named arguments
createPatient(
    clinicPatientID: 'P001',
    lastName: 'Doe',
    firstName: 'John'
);

// Attributes (like TypeScript decorators)
#[Route('/api/patients/{id}', methods: ['GET'])]
public function getPatient(string $id): Response {
    // ...
}
```

**Match Expression:**
```php
$message = match($statusCode) {
    200 => 'Success',
    404 => 'Not Found',
    500 => 'Server Error',
    default => 'Unknown'
};
```

**Nullsafe Operator:**
```php
$city = $patient?->address?->city;
```

**Constructor Property Promotion:**
```php
class Patient {
    public function __construct(
        public string $clinicPatientID,
        public string $lastName,
        public string $firstName,
    ) {}
}
```

---

**Document Version:** 1.1
**Created:** 2026-03-15
**Author:** Claude Code
**Status:** Critical Update - Raspberry Pi Constraints
