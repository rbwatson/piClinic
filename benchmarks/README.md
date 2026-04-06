# piClinic Benchmark Suite

This directory contains the performance benchmark suite for the piClinic API. The suite measures and compares API response times between v1 and v2 across two hardware environments: an Ubuntu VM (development) and a Raspberry Pi 3B+ (production target).

## Directory Structure

```
benchmarks/
├── README.md                     # This file
├── BENCHMARK-PLAN.md             # Full design specification
├── benchmark.conf.example        # Template configuration file (no credentials)
├── endpoint-frequency.md         # API endpoint frequency reference table
├── sql/
│   ├── seed.sql                  # Load benchmark dataset from baseline state
│   └── reset.sql                 # Truncate and re-seed to known state
├── suite-a/                      # User workflow tests (scored)
│   ├── session.js
│   ├── patient.js
│   ├── visit.js
│   ├── icd.js
│   ├── staff.js
│   ├── clinic.js
│   ├── comment.js
│   └── log.js
├── suite-b/                      # Infrastructure operation tests (raw timing only)
│   ├── session-validate.js
│   └── log-write.js
├── scripts/
│   ├── run-benchmark.sh          # Master orchestration script
│   └── report.sh                 # Post-run reporting script
└── results/                      # Runtime output (gitignored)
    └── .gitkeep
```

## Quick Start

1. Copy `benchmark.conf.example` to `benchmark.conf` and fill in your target host and credentials.
2. Ensure the target machine has been deployed with `tools/deploy.sh v1` or `tools/deploy.sh v2`.
3. Reset the benchmark database on the target machine: see BENCHMARK-PLAN.md §3.
4. From your local machine (not the machine under test):
   ```bash
   bash scripts/run-benchmark.sh --config benchmark.conf
   ```
5. Results are written to `results/<timestamp>_<target>_<version>/`.
6. Generate the report:
   ```bash
   bash scripts/report.sh results/<run-directory>/
   ```

## Dependencies

- **k6** — load testing tool. Install from https://k6.io/docs/getting-started/installation/
- **bash** — required for orchestration and reporting scripts
- **mysql client** — required on the machine running the benchmark (for database reset)
- **ssh access** — required to the target machine for database reset operations

## See Also

- `BENCHMARK-PLAN.md` — full design decisions, scoring formula, data requirements
- `endpoint-frequency.md` — endpoint frequency reference used to derive test weights
