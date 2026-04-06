#!/usr/bin/env bash
# benchmarks/scripts/run-benchmark.sh
# Orchestrates a full piClinic benchmark run.
#
# Usage:
#   ./run-benchmark.sh [--config <path>] [--suites AB] [--repeat <n>] [--report]
#
# Defaults:
#   --config   ./benchmark.conf (relative to scripts/ directory)
#   --suites   value from conf, or AB if not set
#   --repeat   value from conf, or 10 if not set
#   --report   not run unless flag present
#
# Requirements:
#   k6, curl, jq, ssh on the PATH (mysql runs on the target via SSH)
#   SSH key-based auth to TARGET_SSH_HOST

set -euo pipefail

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BENCH_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${BENCH_DIR}/.." && pwd)"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
CONF_FILE="${BENCH_DIR}/benchmark.conf"
SUITES_OVERRIDE=""
REPEAT_OVERRIDE=""
RUN_REPORT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)   CONF_FILE="$2"; shift 2 ;;
    --suites)   SUITES_OVERRIDE="$2"; shift 2 ;;
    --repeat)   REPEAT_OVERRIDE="$2"; shift 2 ;;
    --report)   RUN_REPORT=1; shift ;;
    *)          echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Load and validate config
# ---------------------------------------------------------------------------
if [[ ! -f "${CONF_FILE}" ]]; then
  echo "ERROR: config file not found: ${CONF_FILE}" >&2
  echo "Copy benchmark.conf.example to benchmark.conf and fill in values." >&2
  exit 1
fi

# shellcheck source=/dev/null
source "${CONF_FILE}"

: "${TARGET_BASE_URL:?ERROR: TARGET_BASE_URL must be set in ${CONF_FILE}}"
: "${TARGET_VERSION:?ERROR: TARGET_VERSION must be set in ${CONF_FILE}}"
: "${TARGET_LABEL:?ERROR: TARGET_LABEL must be set in ${CONF_FILE}}"
: "${TARGET_SSH_USER:?ERROR: TARGET_SSH_USER must be set in ${CONF_FILE}}"
: "${TARGET_SSH_HOST:?ERROR: TARGET_SSH_HOST must be set in ${CONF_FILE}}"
: "${TARGET_SQL_DIR:?ERROR: TARGET_SQL_DIR must be set in ${CONF_FILE} (path to sql/ on the target machine)}"
: "${BENCHMARK_USERNAME:?ERROR: BENCHMARK_USERNAME must be set in ${CONF_FILE}}"
: "${BENCHMARK_PASSWORD_FILE:?ERROR: BENCHMARK_PASSWORD_FILE must be set in ${CONF_FILE}}"
: "${DB_HOST:?ERROR: DB_HOST must be set in ${CONF_FILE}}"
: "${DB_NAME:?ERROR: DB_NAME must be set in ${CONF_FILE}}"
: "${DB_USER:?ERROR: DB_USER must be set in ${CONF_FILE}}"
: "${DB_PASSWORD_FILE:?ERROR: DB_PASSWORD_FILE must be set in ${CONF_FILE}}"

SUITES="${SUITES_OVERRIDE:-${SUITES:-AB}}"
REPEAT_COUNT="${REPEAT_OVERRIDE:-${REPEAT_COUNT:-10}}"
FREQUENCY_PROFILE="${FREQUENCY_PROFILE:-both}"

# Expand ~ in password file paths
BENCHMARK_PASSWORD_FILE="${BENCHMARK_PASSWORD_FILE/#\~/$HOME}"
DB_PASSWORD_FILE="${DB_PASSWORD_FILE/#\~/$HOME}"

if [[ ! -f "${BENCHMARK_PASSWORD_FILE}" ]]; then
  echo "ERROR: BENCHMARK_PASSWORD_FILE not found: ${BENCHMARK_PASSWORD_FILE}" >&2; exit 1
fi
if [[ ! -f "${DB_PASSWORD_FILE}" ]]; then
  echo "ERROR: DB_PASSWORD_FILE not found: ${DB_PASSWORD_FILE}" >&2; exit 1
fi

BENCHMARK_PASSWORD="$(cat "${BENCHMARK_PASSWORD_FILE}")"
DB_PASSWORD="$(cat "${DB_PASSWORD_FILE}")"

# ---------------------------------------------------------------------------
# Dependency checks
# ---------------------------------------------------------------------------
for cmd in k6 curl jq ssh; do
  if ! command -v "${cmd}" &>/dev/null; then
    echo "ERROR: '${cmd}' is required but not found on PATH" >&2; exit 1
  fi
done

# ---------------------------------------------------------------------------
# Results directory
# ---------------------------------------------------------------------------
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RESULTS_DIR="${BENCH_DIR}/results/${TIMESTAMP}_${TARGET_LABEL}"
mkdir -p "${RESULTS_DIR}"

LOG_FILE="${RESULTS_DIR}/run.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "=== piClinic Benchmark Run ==="
echo "  Target  : ${TARGET_LABEL} (${TARGET_BASE_URL})"
echo "  Version : ${TARGET_VERSION}"
echo "  Suites  : ${SUITES}"
echo "  Repeat  : ${REPEAT_COUNT}"
echo "  Started : ${TIMESTAMP}"
echo ""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
ssh_target() {
  ssh -o BatchMode=yes -o ConnectTimeout=10 \
      "${TARGET_SSH_USER}@${TARGET_SSH_HOST}" "$@"
}

mysql_target() {
  ssh_target "mysql -u '${DB_USER}' -p'${DB_PASSWORD}' '${DB_NAME}'" <<< "$1"
}

mysql_target_file() {
  # Copy SQL file to remote and run it
  local sql_file="$1"
  ssh_target "mysql -u '${DB_USER}' -p'${DB_PASSWORD}' '${DB_NAME}'" < "${sql_file}"
}

die() {
  echo "ERROR: $*" >&2
  # Attempt logout if we have a token
  if [[ -n "${BENCHMARK_TOKEN:-}" ]]; then
    echo "Attempting cleanup logout..." >&2
    logout_benchmark || true
  fi
  exit 1
}

# ---------------------------------------------------------------------------
# Step 1: Reset database and load seed data
# ---------------------------------------------------------------------------
echo "--- Step 1: Reset database ---"

# Check SSH connectivity
ssh_target "echo 'SSH OK'" || die "SSH connection failed to ${TARGET_SSH_HOST}"

# Run reset + base SQL files + seed.sql via piped stdin over SSH
# Base SQL files must exist on the target machine in the expected location
echo "  Running reset.sql..."
mysql_target_file "${BENCH_DIR}/sql/reset.sql"

echo "  Loading base datasets on target..."
SSH_MYSQL="mysql -u '${DB_USER}' -p'${DB_PASSWORD}' '${DB_NAME}'"
ssh_target "
  ${SSH_MYSQL} < '${TARGET_SQL_DIR}/TestClinics.sql' &&
  ${SSH_MYSQL} < '${TARGET_SQL_DIR}/100PatientsNum.sql' &&
  ${SSH_MYSQL} < '${TARGET_SQL_DIR}/TestUsers.sql'
" || die "Failed to load base datasets on target (TARGET_SQL_DIR=${TARGET_SQL_DIR})"

echo "  Running seed.sql..."
mysql_target_file "${BENCH_DIR}/sql/seed.sql"

# ---------------------------------------------------------------------------
# Step 2: Verify baseline records
# ---------------------------------------------------------------------------
echo "--- Step 2: Verify baseline records ---"

VERIFY_SQL="
SELECT
  (SELECT COUNT(*) FROM patient WHERE clinicPatientID IN ('BM-0001','BM-0002','BM-0003')) AS patients,
  (SELECT COUNT(*) FROM visit   WHERE patientVisitID  IN ('BMV-0001','BMV-0002','BMV-0003')) AS visits,
  (SELECT COUNT(*) FROM staff   WHERE username = 'bmtest') AS staff_account;
"
VERIFY_OUT="$(mysql_target "${VERIFY_SQL}" | tail -1)"
read -r V_PATIENTS V_VISITS V_STAFF <<< "${VERIFY_OUT}"

[[ "${V_PATIENTS}" == "3" ]] || die "Seed verification failed: expected 3 patients, got ${V_PATIENTS}"
[[ "${V_VISITS}"   == "3" ]] || die "Seed verification failed: expected 3 visits, got ${V_VISITS}"
[[ "${V_STAFF}"    == "1" ]] || die "Seed verification failed: expected 1 bmtest staff, got ${V_STAFF}"
echo "  Baseline verified: ${V_PATIENTS} patients, ${V_VISITS} visits, bmtest account present."

# ---------------------------------------------------------------------------
# Step 3: Login and capture token
# ---------------------------------------------------------------------------
echo "--- Step 3: Login ---"

if [[ "${TARGET_VERSION}" == "v1" ]]; then
  LOGIN_URL="${TARGET_BASE_URL}/api/session.php"
else
  LOGIN_URL="${TARGET_BASE_URL}/api/v2/auth/login"
fi

# Use a fixed user-agent so the session token is valid for k6 requests.
# validateSession() checks UA; curl and k6 send different strings by default.
BM_USER_AGENT="k6-benchmark/1.0"

LOGIN_RESPONSE="$(curl -sf -X POST "${LOGIN_URL}" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -A "${BM_USER_AGENT}" \
  -d "{\"username\":\"${BENCHMARK_USERNAME}\",\"password\":\"${BENCHMARK_PASSWORD}\"}")" \
  || die "Login request failed"

HTTP_STATUS="$(echo "${LOGIN_RESPONSE}" | jq -r '.status // empty')"
BENCHMARK_TOKEN="$(echo "${LOGIN_RESPONSE}" | jq -r '.data.token // empty')"

[[ -n "${BENCHMARK_TOKEN}" ]] || die "Login failed — no token in response. Response: ${LOGIN_RESPONSE}"
echo "  Login successful. Token captured."
export BENCHMARK_TOKEN

# ---------------------------------------------------------------------------
# logout helper (called at end and on error)
# ---------------------------------------------------------------------------
logout_benchmark() {
  if [[ "${TARGET_VERSION}" == "v1" ]]; then
    curl -sf -X DELETE "${TARGET_BASE_URL}/api/session.php" \
      -H "X-Session-Token: ${BENCHMARK_TOKEN}" \
      -H 'Content-Type: application/json' \
      -d "{\"token\":\"${BENCHMARK_TOKEN}\"}" >/dev/null 2>&1 || true
  else
    curl -sf -X POST "${TARGET_BASE_URL}/api/v2/auth/logout" \
      -H "X-Session-Token: ${BENCHMARK_TOKEN}" \
      -H 'Content-Type: application/json' \
      -d "{\"token\":\"${BENCHMARK_TOKEN}\"}" >/dev/null 2>&1 || true
  fi
}

# ---------------------------------------------------------------------------
# k6 runner — runs a script and returns the captured stdout JSON
# ---------------------------------------------------------------------------
run_k6() {
  local script="$1"
  local out k6_err_file
  k6_err_file="$(mktemp)"
  out="$(k6 run \
    --quiet \
    --env TARGET_BASE_URL="${TARGET_BASE_URL}" \
    --env TARGET_VERSION="${TARGET_VERSION}" \
    --env BENCHMARK_TOKEN="${BENCHMARK_TOKEN}" \
    --env BENCHMARK_USERNAME="${BENCHMARK_USERNAME}" \
    --env BENCHMARK_PASSWORD="${BENCHMARK_PASSWORD}" \
    --env BENCHMARK_USER_AGENT="${BM_USER_AGENT}" \
    --env REPEAT_COUNT="${REPEAT_COUNT}" \
    "${script}" 2>"${k6_err_file}")"
  local k6_exit=$?
  cat "${k6_err_file}" >> "${LOG_FILE}"
  if [[ ${k6_exit} -ne 0 ]]; then
    echo "--- k6 output ---" >&2
    cat "${k6_err_file}" >&2
    rm -f "${k6_err_file}"
    die "k6 run failed for ${script}"
  fi
  rm -f "${k6_err_file}"
  echo "${out}"
}

# ---------------------------------------------------------------------------
# Step 4: Suite B
# ---------------------------------------------------------------------------
SUITE_B_RESULTS="[]"

if [[ "${SUITES}" == *"B"* ]]; then
  echo "--- Step 4: Suite B ---"

  B_RESULTS=()

  for script in "${BENCH_DIR}/suite-b/"*.js; do
    name="$(basename "${script}" .js)"
    echo "  Running suite-b/${name}.js..."
    result="$(run_k6 "${script}")"
    B_RESULTS+=("${result}")
    echo "    ${result}"
  done

  # Combine into JSON array
  if [[ ${#B_RESULTS[@]} -gt 0 ]]; then
    SUITE_B_RESULTS="$(printf '%s\n' "${B_RESULTS[@]}" | jq -s '.')"
  fi
fi

# ---------------------------------------------------------------------------
# Step 5: Suite A
# ---------------------------------------------------------------------------
SUITE_A_RESULTS="[]"

if [[ "${SUITES}" == *"A"* ]]; then
  echo "--- Step 5: Suite A ---"

  A_TESTS=()

  for script in "${BENCH_DIR}/suite-a/"*.js; do
    name="$(basename "${script}" .js)"
    echo "  Running suite-a/${name}.js..."
    result="$(run_k6 "${script}")"
    # Each script returns a JSON array; accumulate all test objects
    while IFS= read -r test_obj; do
      A_TESTS+=("${test_obj}")
    done < <(echo "${result}" | jq -c '.[]')
    echo "    ${result}"
  done

  if [[ ${#A_TESTS[@]} -gt 0 ]]; then
    SUITE_A_RESULTS="$(printf '%s\n' "${A_TESTS[@]}" | jq -s '.')"
  fi
fi

# ---------------------------------------------------------------------------
# Step 6: Logout
# ---------------------------------------------------------------------------
echo "--- Step 6: Logout ---"
logout_benchmark
echo "  Logged out."

# ---------------------------------------------------------------------------
# Step 7: Compute composite scores
# ---------------------------------------------------------------------------
echo "--- Step 7: Computing scores ---"

compute_composite() {
  local profile="$1"  # "normal" or "stress"
  local tests_json="$2"

  echo "${tests_json}" | jq --arg profile "${profile}" --argjson mult \
    '{"rare":0.2,"low":1,"med":10,"high":100}' '
    reduce .[] as $t (
      {"wsum": 0, "msum": 0};
      . + {
        "wsum": (.wsum + ($t.response_time_ms * $mult[$t["frequency_" + $profile]])),
        "msum": (.msum + $mult[$t["frequency_" + $profile]])
      }
    ) | if .msum > 0 then (.wsum / .msum * 100 | round / 100) else 0 end
  '
}

SCORE_NORMAL="$(compute_composite "normal" "${SUITE_A_RESULTS}")"
SCORE_STRESS="$(compute_composite "stress"  "${SUITE_A_RESULTS}")"

echo "  Composite (normal): ${SCORE_NORMAL} ms"
echo "  Composite (stress): ${SCORE_STRESS} ms"

# ---------------------------------------------------------------------------
# Step 8: Write raw.json
# ---------------------------------------------------------------------------
echo "--- Step 8: Writing results ---"

RAW_JSON="${RESULTS_DIR}/raw.json"
jq -n \
  --arg ts        "${TIMESTAMP}" \
  --arg label     "${TARGET_LABEL}" \
  --arg url       "${TARGET_BASE_URL}" \
  --arg ver       "${TARGET_VERSION}" \
  --argjson suite_a "${SUITE_A_RESULTS}" \
  --argjson suite_b "${SUITE_B_RESULTS}" \
  --argjson score_normal "${SCORE_NORMAL}" \
  --argjson score_stress  "${SCORE_STRESS}" \
  '{
    run: {
      timestamp: $ts,
      target_label: $label,
      target_url: $url,
      version: $ver
    },
    tests: $suite_a,
    suite_b: $suite_b,
    scores: {
      composite_normal: $score_normal,
      composite_stress: $score_stress
    }
  }' > "${RAW_JSON}"

echo "  Results written to: ${RAW_JSON}"

# ---------------------------------------------------------------------------
# Step 9: Optionally run report
# ---------------------------------------------------------------------------
if [[ "${RUN_REPORT}" -eq 1 ]]; then
  echo "--- Step 9: Generating report ---"
  bash "${SCRIPT_DIR}/report.sh" "${RAW_JSON}" "${RESULTS_DIR}/report.md"
  echo "  Report written to: ${RESULTS_DIR}/report.md"
fi

echo ""
echo "=== Run complete: ${TARGET_LABEL} ==="
echo "  Composite normal: ${SCORE_NORMAL} ms"
echo "  Composite stress: ${SCORE_STRESS} ms"
echo "  Results dir: ${RESULTS_DIR}"
