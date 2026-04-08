# piClinic Benchmark — Composite Report

## Overview

This report combines all four benchmark runs to show backend API performance
across platforms and API versions.

| Run | Platform | Version | Timestamp |
|---|---|---|---|
| ubuntu-v1 | Ubuntu VM | v1 | 20260407T144433Z |
| ubuntu-v2 | Ubuntu VM | v2 | 20260407T151528Z |
| raspi-v1  | Raspberry Pi 3B+ | v1 | 20260408T123218Z |
| raspi-v2  | Raspberry Pi 3B+ | v2 | 20260408T004854Z |

All tests run on the same local network. Ubuntu target: `192.168.169.181`.
Pi target: `192.168.169.247`. Composite score = frequency-weighted mean
response time (lower is better).

Frequency tiers: `rare=0.2`, `low=1`, `med=10`, `high=100`.

---

## Composite Scores

| Profile | Ubuntu v1 (ms) | Ubuntu v2 (ms) | Pi v1 (ms) | Pi v2 (ms) | Notes |
|---|---|---|---|---|---|
| Normal (45-week typical) | 8.59 | 7.24 | 19.84 | 22.77 | Pi ~2.3–3.1x Ubuntu; v2 overhead on Pi is ~3ms |
| Stress (5-week event)    | 15.26 | 12.41 | 34.61 | 37.66 | Pi ~2.8–3.0x Ubuntu; ratio is consistent across profiles |

**Key observation:** v2 is faster than v1 on Ubuntu (composite improvement
~16%). On the Pi, v2 is slightly slower than v1 (+3ms normal, +3ms stress),
but within acceptable tolerance given the v1 baseline users have already
experienced.

---

## Suite A — Endpoint Detail

Pi/Ubuntu ratio of ~3x is the expected baseline. Notes flag deviations from
that pattern. "Pi faster" means the Pi outperformed its expected ratio.
"Anomaly" means the result is unexpectedly different from the pattern.

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| clinic | GET | This clinic info | 3 | 5 | 13 | 16 | low | low | |
| clinic | GET | Clinic info by ID | 3 | 3 | 9 | 12 | rare | rare | |

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| comment | GET | By username | 4 | 9 | 9 | 11 | low | low | Pi v1 within 1x of Ubuntu v2 |
| comment | GET | By date | 3 | 4 | 7 | 9 | rare | rare | |
| comment | POST | Create | 20 | 11 | 14 | 15 | low | low | Pi v1 faster than Ubuntu v1; v2 shows improvement on both platforms |

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| icd | GET | By diagnosis code | 57 | 4 | 196 | 12 | low | med | **Pi v1 very slow (196ms); v2 fixes this (12ms) — likely index change** |
| icd | GET | By description | 40 | 43 | 150 | 178 | med | high | Pi ~4x Ubuntu; above expected ratio — probable full table scan on SD card |
| icd | GET | By index | 31 | 39 | 82 | 173 | low | low | **Pi v2 regresses vs Pi v1 (82→173ms); v2 slower than v1 on Pi only** |
| icd | PATCH | Update ICD record | 26 | 0 | 18 | 0 | rare | rare | v2 does not implement this endpoint (0ms = not run) |

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| log | GET | By log date | 7 | 8 | 8 | 9 | rare | rare | Pi within ~1x of Ubuntu — unusually close, possibly due to the small size of the log DB used in the test |
| log | GET | By log class | 3 | 4 | 7 | 9 | rare | rare | |
| log | GET | By source module | 3 | 4 | 7 | 9 | rare | rare | |
| log | POST | Write log entry | 10 | 10 | 9 | 14 | low | low | Pi v1 faster than Ubuntu v1, possibly due to the small size of the log DB used in the test |

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| patient | GET | By clinic patient ID | 4 | 4 | 10 | 12 | high | high | |
| patient | GET | By last name | 2 | 3 | 8 | 11 | low | med | |
| patient | GET | By last + first name | 3 | 3 | 8 | 11 | low | med | |
| patient | GET | By city | 5 | 3 | 15 | 11 | low | low | Pi v2 faster than Pi v1 (15→11ms); v2 improvement more pronounced on Pi |
| patient | POST | Create patient | 19 | 13 | 17 | 18 | med | high | Pi v1 faster than Ubuntu v1; v2 improvement holds on both platforms |
| patient | PATCH | Update patient | 17 | 11 | 22 | 20 | med | high | |
| patient | DELETE | Deactivate patient | 17 | 10 | 15 | 15 | rare | rare | Pi v1 faster than Ubuntu v1 |

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| session | POST | Login | 214 | 203 | 649 | 649 | low | med | **Pi ~3x Ubuntu as expected but absolute value (649ms) is high — CPU-bound bcrypt** |
| session | DELETE | Logout | 18 | 10 | 13 | 14 | low | med | Pi v1 faster than Ubuntu v1 |

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| staff | GET | By username | 3 | 4 | 9 | 11 | rare | rare | |
| staff | GET | By last name | 2 | 3 | 7 | 11 | rare | rare | |
| staff | POST | Create staff account | 65 | 57 | 648 | 644 | rare | rare | **Pi ~10x Ubuntu — CPU-bound bcrypt on account creation; rare frequency limits composite impact** |
| staff | PATCH | Update staff record | 17 | 12 | 18 | 18 | rare | rare | Pi within ~1x of Ubuntu v1 |
| staff | DELETE | Deactivate staff | 16 | 10 | 16 | 15 | rare | rare | Pi v1 matches Ubuntu v1 exactly |

| Resource | Method | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Freq (normal) | Freq (stress) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| visit | GET | Open visits list (dashboard) | 5 | 4 | 11 | 14 | high | high | |
| visit | GET | By visit ID | 3 | 3 | 6 | 12 | med | high | Pi v2 regression vs Pi v1 (6→12ms); v2 adds overhead not seen on Ubuntu |
| visit | GET | By patient visit ID | 2 | 3 | 8 | 12 | med | high | Pi v2 regression vs Pi v1 (8→12ms) |
| visit | GET | Patient visit history | 3 | 3 | 8 | 14 | med | high | Pi v2 regression vs Pi v1 (8→14ms); high frequency — worth monitoring |
| visit | POST | Open visit | 20 | 12 | 20 | 23 | med | high | Pi v1 matches Ubuntu v1; v2 slight regression on Pi |
| visit | PATCH | Update visit | 18 | 12 | 24 | 22 | med | high | |

---

## Suite B — Infrastructure

| Test | Variant | Ubuntu v1 | Ubuntu v2 | Pi v1 | Pi v2 | Notes |
|---|---|---|---|---|---|---|
| log_write | Write log entry | 13 | 17 | 10 | 16 | Pi v1 faster than Ubuntu v1 on both versions |
| session_validate | Validate session token | 5 | 7 | 7 | 16 | **Pi v2 more than 2x Pi v1 (7→16ms); runs on every authenticated request** |

---

## Key Findings

### Platform ratio (Pi vs. Ubuntu)
Most endpoints follow a ~3x ratio. Exceptions:

- **ICD queries** run ~4–5x slower on the Pi, consistent with SD card I/O on
  table scans. A faster/separate I/O and boot architecture, such as a USB SSD boot would likely close this gap.
- **bcrypt operations** (session login, staff create) run ~3x slower in absolute
  terms but sit at 649ms on the Pi. This is CPU-bound and expected. Both are
  low/rare frequency so composite impact is limited.
- **Several endpoints** (log GET, log POST, patient POST/DELETE, session DELETE,
  staff DELETE) run at or faster than Ubuntu on the Pi v1, possibly due to the small size of the test database tables used in the test.

### v1 vs. v2
- v2 is faster than v1 on Ubuntu overall (composite -16% normal, -19% stress).
- v2 is slightly slower than v1 on the Pi (composite +15% normal, +9% stress),
  but the absolute difference is ~3ms — within the tolerance users already accept.
- `icd GET by diagnosis code` is the standout v2 improvement: 196ms → 12ms on
  the Pi. Almost certainly an indexing improvement in the v2 query path.
- `icd GET by index` regresses on the Pi in v2 (82ms → 173ms). Worth
  investigating whether the v2 query path for this endpoint is less efficient
  than v1.
- Visit GET endpoints show a consistent Pi v2 regression (~6–8ms → 12–14ms)
  not visible on Ubuntu. Given their `med`/`high` frequency, these are worth
  profiling before finalizing the v2 API.
- `session_validate` (Suite B) doubles on Pi v2 vs. Pi v1. Since this runs on
  every authenticated request, it has an outsized effect on perceived
  responsiveness in the minimal (self-hosted) deployment.

### Hardware recommendations for v2
- **Pi 3B+ with SD card:** Viable. Composite scores are within tolerated range.
  ICD text search and session validation are the weak points.
- **Pi 3B+ with USB SSD:** Recommended minimum. Eliminates SD card I/O as a
  variable for ICD queries and reduces write-wear degradation over time.
- **Pi 4 (4GB) with USB SSD:** Recommended for minimal (self-hosted browser)
  deployments where the React frontend and API server share the same hardware.

### Benchmark recommendations
- **Create more realistic data bases and operations:** Except for the ICD10 database, the sample databases did not contain a realistic database size. A more realistic database might have: 1000 patients with 5-6,000 visits. In extreme cases, common ICD10 codes could be cached to accellerate lookup.

---

*Benchmark data from `benchmarks/results/`. Report compiled 2026-04-08.*
