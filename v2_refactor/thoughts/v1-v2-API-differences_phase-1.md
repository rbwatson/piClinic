# V1 / V2 API Differences — Phase 1 Findings

Discovered during development and debugging of the benchmark suite (`benchmarks/`).
These differences affected every k6 script in Suite A and Suite B and required
version-conditional logic throughout.

---

## Authentication

| Aspect | V1 | V2 |
|---|---|---|
| Auth header name | `X-Piclinic-Token` | `X-Session-Token` |
| Session validation | Token only | Token + IP + User-Agent must all match the login session |

---

## URL Structure

| Aspect | V1 | V2 |
|---|---|---|
| Base path | `/api/<resource>.php` | `/api/v2/<resource>` |
| Resource identifier | Query string param (`?clinicPatientID=X`) | URL path segment (`/patients/X`) |

---

## Request Parsing (Critical V1 Behavior)

V1's `readRequestData()` uses a priority chain — `$_GET` first, then `$_POST`,
then `php://input`. If any query string params are present, the JSON body is
never read. Consequently:

- **V1 PATCH**: identifier and update fields must both go in the JSON body.
  Splitting them across query string + body means the body is silently ignored.
- **V2 PATCH**: identifier goes in the URL path, update fields go in the body.

---

## Parameter Naming

| Endpoint | V1 | V2 |
|---|---|---|
| Clinic — this clinic | `?thisClinic=1` | `?thisClinic=1` |
| Clinic — by ID | `?publicID=205` | `?clinicPublicID=205` |
| Patient — filter by city | `?HomeCity=X` (PascalCase) | `?homeCity=X` |
| Patient — PATCH body fields | `homeCity` (camelCase, from implementation) | `homeCity` |
| Staff — POST required fields | `memberID` required (not in public API docs) | not required |

Note: V1 documentation sometimes uses PascalCase parameter names (e.g. `HomeCity`,
`NameLast`) while the implementation uses camelCase (`homeCity`, `lastName`).
The implementation takes precedence.

---

## ICD Endpoint

| Aspect | V1 | V2 |
|---|---|---|
| Lookup by code | `?q=A00.0` or `?t=<description>` | `GET /icd/A00.0` (path param) |
| `icd10index` column | Stores codes without dots (`A000`) | — |
| `icd10code` column | Stores codes with dots (`A00.0`) | — |
| PATCH (update last-used) | Exists; requires `icd10index` (dotless) + `language` in query | Not implemented |
| PATCH in benchmark | Included (`if VER === 'v1'` guard) | Excluded |

---

## Log POST Required Fields

| Field | V1 | V2 |
|---|---|---|
| `userToken` | Required | Required |
| `sourceModule` | Required | Required |
| `logClass` | Required | Required |
| `logTable` | **Required** | Not required |
| `logAction` | **Required** | Not required |
| Minimum access level | SystemAdmin | Token only |

---

## Visit POST — ID Generation

V1 generates `patientVisitID` as `patientID(12 digits) + date(8 digits) + dailyIndex(2 digits)`.
The daily index is determined by querying existing visits for that patient on that
date and taking the index from the most recently returned record. The sort order
of that query is unreliable: if a seeded visit with a short custom ID (e.g.
`BMV-0001`) is returned first, its computed index is 0, the new index is set to 1,
and every subsequent POST for the same patient on the same date generates the same
`patientVisitID` — resulting in a 409 Duplicate error.

Benchmark workaround: pass a distinct `dateTimeIn` (same past year, day increments
by iteration) so each POST targets a different calendar date and always receives
index 1 on a unique date.

V2 generates its own unique `patientVisitID` without this constraint.

---

## Access Control

| Aspect | V1 | V2 |
|---|---|---|
| Model | Page access levels (`ClinicStaff=8`, `ClinicAdmin=16`, `SystemAdmin=32`) | Token presence only |
| Log POST | Requires `SystemAdmin` | Any valid token |
| Patient/Visit write | Requires `ClinicAdmin` | Any valid token |

The benchmark `bmtest` account must be set to `SystemAdmin` in V1 to exercise all
endpoints. In V2 any valid session token is sufficient.

---

*Source: benchmark development on `phase-1-benchmarks` branch, April 2026.*
