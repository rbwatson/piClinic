# piClinic API Endpoint Frequency Table

Use this table to assign frequency of daily use for each API operation.
Frequency values: `rare` = 0.2x/day, `low` = 1x/day, `med` = 10x/day, `high` = 100x/day

Normal = typical 45-week clinic operation. Stress = 5-week special health event periods.

| Resource | Method | Query variant | Key params | Normal | Stress | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| session | POST | Login | `username`, `password` | low | med | |
| session | GET | Validate session | `token` | high | high | Called internally on every authenticated API request. Suite B candidate. |
| session | PATCH | Extend session | `token` | rare | rare | Not used in normal workflow; default session life is 1 day. |
| session | DELETE | End a session | `token` | low | med | Modeled as equal to login frequency (worst case). In practice most sessions expire rather than log out explicitly. |
| patient | GET | By clinic patient ID | `clinicPatientID` | high | high | Primary patient lookup. |
| patient | GET | By last name | `NameLast` | low | med | Typically used when adding a new patient to check for duplicates. |
| patient | GET | By last + first name | `NameLast`, `NameFirst` | low | med | Refinement of last-name search; same workflow context. |
| patient | GET | By city / neighborhood | `HomeCity`, `HomeNeighborhood` | low | low | Less common search path. |
| patient | POST | Create patient | `clinicPatientID`, `NameLast`, `NameFirst`, `Sex`, `BirthDate` | med | high | |
| patient | PATCH | Update patient | `clinicPatientID` + fields | med | high | |
| patient | DELETE | Deactivate patient | `clinicPatientID` | rare | rare | Soft delete only; record is retained in database. |
| visit | GET | Open visits list (dashboard) | `visitStatus=Open` | high | high | Post-login landing page; loaded on every login and dashboard refresh. |
| visit | GET | By visit ID | `visitID` | med | high | |
| visit | GET | By patient visit ID | `patientVisitID` | med | high | |
| visit | GET | Patient visit history | `clinicPatientID` | med | high | |
| visit | POST | Open visit | `clinicPatientID`, `visitType` | med | high | |
| visit | PATCH | Update visit | `patientVisitID` + fields | med | high | |
| icd | GET | By diagnosis code | `diagnosisCode` | low | med | |
| icd | GET | By description (search) | `shortDescription` | med | high | Autocomplete lookup during visit entry. |
| icd | GET | By index | `icd10index` | low | low | |
| icd | PATCH | Update ICD record | `icd10index` + fields | rare | rare | Admin operation; not part of normal clinical workflow. |
| staff | GET | By username | `username` | rare | rare | |
| staff | GET | By last name | `NameLast` | rare | rare | |
| staff | POST | Create staff account | `username`, `password`, `NameLast`, `NameFirst`, `accessGranted` | rare | rare | Admin operation. |
| staff | PATCH | Update staff record | `username` + fields | rare | rare | Admin operation. |
| staff | DELETE | Deactivate staff | `username` | rare | rare | Admin operation. |
| clinic | GET | Get clinic info | (none) | low | med | |
| comment | GET | By date | `commentDate` | rare | rare | |
| comment | GET | By username | `username` | rare | rare | |
| comment | POST | Submit comment | `commentText` | rare | rare | |
| log | GET | By date | `logDate` | rare | rare | Admin/debug use. |
| log | GET | By type | `logType` | rare | rare | Admin/debug use. |
| log | GET | By source file | `logSourceFile` | rare | rare | Admin/debug use. |
| log | POST | Write log entry | `logType`, `logSourceFile`, `logMessage` | med | high | Called internally by other API operations. Suite B candidate. Debug logging is a separate config option not used in production. |
| locImage | GET | Get location image | `imageID` | rare | rare | |

## Suite Notes

**Suite A (user workflow tests):** All rows above, called directly with an authenticated token. Response times weighted by Normal or Stress frequency to produce a composite score.

**Suite B (infrastructure operation tests):** `session GET` (validate) and `log POST` (write log entry). Called internally by Suite A operations rather than directly by user workflows. Reported as raw timing only, not included in the weighted score. Suite B timing helps explain variance in Suite A results.
