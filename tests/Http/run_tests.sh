#!/usr/bin/env bash
# run_tests.sh - piClinic HTTP integration test runner
#
# Usage:
#   bash tests/Http/run_tests.sh [service ...]
#
# Arguments:
#   service     One or more service names to run (auth, patients, visits,
#               staff, clinic, icd). Omit to run all services.
#
# Environment variables:
#   BASE_URL            API base URL (default: http://localhost)
#   ENV_FILE            Path to .env file for DB credentials
#                       (default: /var/www/html/api/.env)
#   TEST_STAFF_PASSWORD Plain-text password for test staff accounts
#                       Must match the hash in sql/TestUsers.sql
#
# Examples:
#   bash tests/Http/run_tests.sh
#   bash tests/Http/run_tests.sh patients
#   bash tests/Http/run_tests.sh auth visits
#   BASE_URL=http://192.168.1.50 bash tests/Http/run_tests.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/helpers.sh"
source "${SCRIPT_DIR}/lib/db.sh"

BASE_URL="${BASE_URL:-http://localhost}"
export BASE_URL

# ---------------------------------------------------------------------------
# Services to run (all by default, filtered by args)
# ---------------------------------------------------------------------------
ALL_SERVICES=(auth patients visits staff clinic icd)

if [ $# -gt 0 ]; then
    SERVICES=("$@")
else
    SERVICES=("${ALL_SERVICES[@]}")
fi

# ---------------------------------------------------------------------------
# Counters and coverage tracking
# ---------------------------------------------------------------------------
PASS_COUNT=0
FAIL_COUNT=0
declare -A COVERED_OPERATIONS   # operationId -> 1

# Full list of operationIds from openapi.yaml
ALL_OPERATIONS=(
    login getSession logout refreshSession
    getPatient searchPatients createPatient updatePatient deletePatient
    getVisit searchVisits createVisit updateVisit deleteVisit
    getStaffMember listStaff createStaffMember updateStaffMember deleteStaffMember
    searchClinics
    searchIcdCodes getIcdCode
)

# ---------------------------------------------------------------------------
# Run a single test file, collect pass/fail, track coverage
# ---------------------------------------------------------------------------
run_test() {
    local test_file="$1"

    # Extract OPERATION declaration from the test file (# OPERATION: operationId)
    local operation
    operation=$(grep -m1 '^# OPERATION:' "$test_file" | awk '{print $3}')
    if [ -n "$operation" ]; then
        COVERED_OPERATIONS["$operation"]=1
    fi

    # Run the test as a subprocess; capture output and exit code.
    # The || true prevents set -e from aborting the runner on test failure.
    local output exit_code=0
    output=$(bash "$test_file" 2>&1) || exit_code=$?

    echo "$output"

    if [ "$exit_code" -eq 0 ]; then
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# ---------------------------------------------------------------------------
# Prerequisite checks — halt the run if any fail
# ---------------------------------------------------------------------------
echo ""
echo "=== piClinic HTTP Integration Tests ==="
echo "    Base URL: ${BASE_URL}"
echo ""

echo "[check] Server connectivity..."
if ! curl -s --max-time 5 "${BASE_URL}/api/v2/auth/login" > /dev/null 2>&1; then
    echo "ERROR: Cannot reach ${BASE_URL}. Is the server running?" >&2
    exit 1
fi
echo "[check] Server is reachable."

echo "[check] Database connectivity..."
if ! db_check; then
    exit 1
fi
echo "[check] Database is reachable."

# ---------------------------------------------------------------------------
# Warn and prompt before resetting the database
# ---------------------------------------------------------------------------
echo ""
echo "WARNING: Running these tests will reset the database to the known test"
echo "         state, replacing any existing patient, visit, and staff data."
echo ""
read -r -p "Continue? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
db_reset

# ---------------------------------------------------------------------------
# Prerequisite test: login
# Must succeed before any other tests can run.
# ---------------------------------------------------------------------------
echo ""
echo "[prereq] Logging in as test user..."

if [ -z "${TEST_STAFF_PASSWORD:-}" ]; then
    echo "ERROR: TEST_STAFF_PASSWORD is not set." >&2
    echo "       Set it to the plain-text password for accounts in sql/TestUsers.sql." >&2
    exit 1
fi

login_response=$(api_post_anon "/auth/login" \
    "{\"username\":\"TestCS\",\"password\":\"${TEST_STAFF_PASSWORD}\"}")
login_status=$(http_status "$login_response")
login_body=$(http_body "$login_response")

if [ "$login_status" != "201" ]; then
    echo "ERROR: Login failed (HTTP ${login_status}). Cannot proceed." >&2
    echo "       Response: ${login_body}" >&2
    echo "       Check TEST_STAFF_PASSWORD and that TestCS exists in the database." >&2
    exit 1
fi

TOKEN=$(echo "$login_body" | jq -r '.data.token')
export TOKEN
echo "[prereq] Login successful. Token acquired."

# ---------------------------------------------------------------------------
# Run tests for each requested service
# ---------------------------------------------------------------------------
echo ""
echo "--- Running tests ---"
echo ""

for service in "${SERVICES[@]}"; do
    service_dir="${SCRIPT_DIR}/${service}"

    if [ ! -d "$service_dir" ]; then
        echo "WARNING: Service directory not found: ${service_dir}" >&2
        continue
    fi

    # Run optional per-service setup (sourced so exported vars persist)
    if [ -f "${service_dir}/setup.sh" ]; then
        echo "[setup] ${service}..."
        # shellcheck source=/dev/null
        source "${service_dir}/setup.sh"
    fi

    # Run each test file in alphabetical order
    for test_file in "${service_dir}"/test_*.sh; do
        [ -f "$test_file" ] || continue
        run_test "$test_file"
    done
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
total=$((PASS_COUNT + FAIL_COUNT))
echo ""
echo "--- Results ---"
printf "    %d passed, %d failed (%d total)\n" \
    "$PASS_COUNT" "$FAIL_COUNT" "$total"

# Coverage report
echo ""
echo "--- HTTP Test Coverage ---"
uncovered=()
for op in "${ALL_OPERATIONS[@]}"; do
    if [ -z "${COVERED_OPERATIONS[$op]+_}" ]; then
        uncovered+=("$op")
    fi
done

covered_count=$(( ${#ALL_OPERATIONS[@]} - ${#uncovered[@]} ))
printf "    %d/%d operations covered\n" "$covered_count" "${#ALL_OPERATIONS[@]}"

if [ ${#uncovered[@]} -gt 0 ]; then
    echo "    Untested: ${uncovered[*]}"
fi

echo ""

# Exit with failure if any tests failed
[ "$FAIL_COUNT" -eq 0 ]
