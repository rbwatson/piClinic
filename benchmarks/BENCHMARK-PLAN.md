# piClinic Benchmark Plan

## 1. Purpose

This benchmark suite measures and compares API response times between:

- **v1** (PHP monolith, current production) and **v2** (refactored PHP API)
- **Ubuntu VM** (development environment) and **Raspberry Pi 3B+** (production target)

The primary goal is to confirm that v2 performs at least as well as v1 on the Pi 3B+, and to quantify any performance differences on both platforms.

---

## 2. Design Principles

- Tests run from a **separate machine**, not the machine under test.
- Tests are **single-threaded, single-user**. The system is designed for small clinics where concurrent interactions are unusual.
- Tests are **OS-independent** (Mac/Linux). The k6 tool runs on both.
- An **unexpected error halts the test**. Errors should not occur against a properly configured target.
- The benchmark database is **reset to a known state before each run**. Reset time is not counted in the score.
- Tests are **self-specifying**: each test case documents the data it requires. The SQL seed script is derived from those requirements.
- **v1 and v2 use the same test scripts**, differentiated only by the base URL in the config file.

---

## 3. Environments

### 3.1 Target machines

| Label | Hardware | OS | Role |
|---|---|---|---|
| `ubuntu-v1` | Ubuntu VM | Ubuntu LTS | v1 baseline |
| `ubuntu-v2` | Ubuntu VM | Ubuntu LTS | v2 comparison |
| `pi-v1` | Raspberry Pi 3B+ | Raspberry Pi OS | v1 production baseline |
| `pi-v2` | Raspberry Pi 3B+ | Raspberry Pi OS | v2 production target |

### 3.2 Test machine requirements

- Mac or Linux
- k6 installed
- bash
- mysql client (for remote database reset via SSH)
- SSH access to target machines

### 3.3 Target URL configuration

The base URL for each run is set in `benchmark.conf`:

```
TARGET_BASE_URL=http://192.168.1.x
TARGET_VERSION=v1
TARGET_LABEL=ubuntu-v1
```

The test scripts construct endpoint URLs as:
- v1: `${TARGET_BASE_URL}/api/session.php`
- v2: `${TARGET_BASE_URL}/api/v2/session` (TBD — path TBC when v2 API is implemented)

---

## 4. Authentication

All Suite A and Suite B tests (except session POST) require a valid session token.

- A dedicated benchmark test account is configured on each target machine.
- Credentials are stored in `benchmark.conf` (never committed to the repo).
- The orchestration script logs in at the start of each run, captures the token from `data.token` in the 201 response, and passes it to all subsequent test scripts via an environment variable.
- The token is used for the duration of the run. Session life is 1 day, so no refresh is needed.

---

## 5. Database State

### 5.1 Baseline dataset

The benchmark database is a controlled dataset loaded from `benchmarks/sql/seed.sql`. It is derived from existing SQL scripts in `sql/` and extended with visit data and benchmark-specific records.

**Baseline dataset contents:**

| Table | Content | Source |
|---|---|---|
| clinic | 1 test clinic record | `sql/TestClinics.sql` |
| staff | Test users including benchmark account | `sql/TestUsers.sql` |
| patient | 100 patients with known IDs, names, cities | `sql/100Patients.sql` |
| visit | ~200 visits across patients (open and closed) | New — to be generated |
| icd10 | Full ICD-10 code table | `sql/icd10.sql` |

### 5.2 Known test records

The following specific records must exist in the benchmark dataset. Test scripts reference them by these exact values:

**Patient records:**

| clinicPatientID | NameLast | NameFirst | HomeCity | Purpose |
|---|---|---|---|---|
| BM-0001 | Benchmark | Alpha | TestCity | Primary lookup patient |
| BM-0002 | Benchmark | Beta | TestCity | Secondary lookup patient |
| BM-0003 | Testcase | Gamma | OtherCity | City/neighborhood search |

**Visit records:**

| patientVisitID | clinicPatientID | visitStatus | Purpose |
|---|---|---|---|
| BMV-0001 | BM-0001 | Open | Dashboard open visit list |
| BMV-0002 | BM-0001 | Closed | Patient visit history |
| BMV-0003 | BM-0002 | Open | Visit by patient visit ID |

**ICD-10 records (must exist in icd10 table):**

| diagnosisCode | shortDescription | Purpose |
|---|---|---|
| A00.0 | Cholera due to Vibrio cholerae | Lookup by code |
| Z00 | (any matching Z00 code) | Lookup by description search |

**Staff / test account:**

| username | accessGranted | Purpose |
|---|---|---|
| bmtest | ClinicStaff | Benchmark test account |

### 5.3 Reset procedure

Before each run, the orchestration script:

1. SSHes to the target machine.
2. Runs `benchmarks/sql/reset.sql` against the piclinic database.
3. Runs `benchmarks/sql/seed.sql` to restore the baseline state.
4. Verifies the expected records exist before starting tests.

Reset time is not included in any test measurements.

---

## 6. Test Suites

### 6.1 Suite A — User Workflow Tests

Suite A tests represent direct user-facing API calls. Each test:

- Makes a single HTTP request with the appropriate method, params, and auth token.
- Records the response time in milliseconds.
- Verifies the expected HTTP response code. Any unexpected response halts the run.
- Is assigned a frequency weight used to calculate the composite score.

Test scripts are in `benchmarks/suite-a/`. Each script covers one resource and includes all query variants for that resource as separate test cases.

### 6.2 Suite B — Infrastructure Operation Tests

Suite B tests cover operations that are called internally by the API rather than directly by user workflows:

- `session GET` — token validation, called on every authenticated request
- `log POST` — log entry write, called by most API operations

Suite B results are reported as raw timing only. They are not included in the weighted composite score. Suite B timing provides context for explaining variance in Suite A results — if Suite B operations are slow, Suite A operations that trigger them will reflect that cost.

---

## 7. Frequency Weights

Each Suite A test case is assigned a frequency tier based on estimated daily usage in two clinic scenarios:

| Tier | Multiplier | Typical operations |
|---|---|---|
| rare | 0.2 | Admin operations, rarely used paths |
| low | 1 | Once per clinic day |
| med | 10 | Several times per clinic day |
| high | 100 | Very frequent, core workflow |

Two frequency profiles are defined:

- **Normal** — typical 45-week clinic operation
- **Stress** — 5-week special health event periods with elevated patient volume

See `endpoint-frequency.md` for the full per-operation frequency assignments.

### 7.1 Composite score formula

For a given run:

```
weighted_time(test) = response_time_ms(test) * frequency_multiplier(test)
raw_score = sum(weighted_time) across all Suite A tests
composite_score = raw_score / sum(frequency_multipliers)
```

The composite score is a **frequency-weighted mean response time in milliseconds**. Lower is better.

A separate composite score is calculated for Normal and Stress frequency profiles.

---

## 8. Output Format

### 8.1 Raw results file

Each test run produces a JSON results file at:
```
results/<timestamp>_<target_label>/raw.json
```

Format:
```json
{
  "run": {
    "timestamp": "2026-04-06T14:30:00Z",
    "target_label": "ubuntu-v1",
    "target_url": "http://192.168.1.x",
    "version": "v1",
    "suite": "A"
  },
  "tests": [
    {
      "resource": "patient",
      "method": "GET",
      "variant": "By clinic patient ID",
      "response_time_ms": 42,
      "http_status": 200,
      "frequency_normal": "high",
      "frequency_stress": "high"
    }
  ],
  "scores": {
    "composite_normal": 38.4,
    "composite_stress": 41.2
  }
}
```

### 8.2 Summary report

The reporting script produces a human-readable Markdown summary from one or more raw results files, suitable for comparison across runs:

```
results/<timestamp>_<target_label>/report.md
```

The summary includes:
- Run metadata (target, version, timestamp)
- Composite scores (Normal and Stress)
- Per-test response times in a table
- Suite B raw timings
- Delta vs. a specified baseline run (optional)

---

## 9. Benchmark Configuration File

The config file `benchmark.conf` is not committed to the repo. Copy `benchmark.conf.example` and fill in values:

```bash
# Target machine
TARGET_BASE_URL=http://192.168.1.x
TARGET_VERSION=v1
TARGET_LABEL=ubuntu-v1

# SSH access for database reset
TARGET_SSH_USER=piClinic
TARGET_SSH_HOST=192.168.1.x

# Benchmark test account (on target machine)
BENCHMARK_USERNAME=bmtest
BENCHMARK_PASSWORD_FILE=~/.piclinic-bench-pass

# Database credentials (on target machine)
DB_HOST=localhost
DB_NAME=piclinic
DB_USER=CTS-user
DB_PASSWORD_FILE=~/.piclinic-db-pass

# Which suites to run: A, B, or AB
SUITES=AB

# Frequency profile for scoring: normal, stress, or both
FREQUENCY_PROFILE=both
```

Passwords are stored in separate files referenced by path, never inline in the config.

---

## 10. Orchestration Script Behavior

`scripts/run-benchmark.sh` performs the following sequence:

1. Load and validate config.
2. SSH to target — reset database to baseline state.
3. Verify baseline records exist (smoke check).
4. Login — POST to session endpoint, capture token.
5. Run Suite B (if configured).
6. Run Suite A tests in order, passing token via environment variable.
7. On any unexpected HTTP response — log the error, halt the run, attempt logout.
8. Logout — DELETE session.
9. Write raw results to `results/` directory.
10. Optionally run reporting script.

---

## 11. Files To Be Implemented

The following files are specified here but not yet written. This plan is the input to Claude Code for implementation.

| File | Status | Notes |
|---|---|---|
| `benchmarks/sql/seed.sql` | To do | Derived from `sql/100Patients.sql`, `sql/TestUsers.sql`, `sql/TestClinics.sql`, plus visit data and benchmark-specific records from §5.2 |
| `benchmarks/sql/reset.sql` | To do | Truncates benchmark-owned tables and re-runs seed.sql |
| `benchmarks/suite-a/session.js` | To do | Login, logout |
| `benchmarks/suite-a/patient.js` | To do | All patient query variants |
| `benchmarks/suite-a/visit.js` | To do | All visit query variants |
| `benchmarks/suite-a/icd.js` | To do | ICD lookup variants |
| `benchmarks/suite-a/staff.js` | To do | Staff lookup and admin ops |
| `benchmarks/suite-a/clinic.js` | To do | Clinic info |
| `benchmarks/suite-a/comment.js` | To do | Comment ops |
| `benchmarks/suite-a/log.js` | To do | Log GET variants |
| `benchmarks/suite-b/session-validate.js` | To do | Token validation |
| `benchmarks/suite-b/log-write.js` | To do | Log entry write |
| `benchmarks/scripts/run-benchmark.sh` | To do | Master orchestration |
| `benchmarks/scripts/report.sh` | To do | Reporting |
| `benchmarks/benchmark.conf.example` | To do | Config template |
